#!/usr/bin/env bash
# Builds the scratch APP_ROOT tree that remote-deploy.sh expects, so the REAL
# script can run unmodified against a local stack.
#
# Everything generated goes under SCRATCH_DIR (default
# /tmp/homeroll-scratch-deploy) so nothing generated lands in the repo.
#
# Deviations from prod, and why each is unavoidable:
#   1. ENV=scratch, not prod. prod.yml pins `platform: linux/arm64`; dev boxes
#      are amd64. scratch.yml below is prod.yml with that pin removed and the
#      env_file repointed. Everything under test (base.yml's migrate service,
#      the depends_on gates, restart:"no") is INHERITED FROM THE REAL base.yml,
#      which is copied verbatim.
#   2. /usr/local/bin/betaname-backup.sh is stubbed — remote-deploy.sh hardcodes
#      that absolute path, so it cannot be redirected via PATH.
#   3. `aws` is shimmed to exit 1 so download_if_exists() short-circuits and
#      remote-deploy.sh uses the pre-staged compose dir instead of S3.
#   4. `sudo` is shimmed to a passthrough. remote-deploy.sh runs compose as
#      `sudo -E docker compose ...`, and -E only preserves the environment if
#      sudoers permits it. Under SSM the script already runs as root so this is
#      moot, but on a workstation the default policy strips APP_NAME/API_IMAGE
#      and compose then resolves `${API_IMAGE:-${APP_NAME}-api:latest}` to the
#      invalid reference `-api:latest`. Passthrough keeps the env intact; docker
#      needs no root for a user in the `docker` group, and every other sudo'd
#      path here lives under SCRATCH_DIR in /tmp.
# remote-deploy.sh itself is NOT modified.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="${REPO:-$(cd "${HERE}/../../.." && pwd)}"
# Deliberately NOT named WORK_DIR: remote-deploy.sh has its own WORK_DIR and
# would inherit ours if the name collided.
SCRATCH_DIR="${SCRATCH_DIR:-/tmp/homeroll-scratch-deploy}"
APP_ROOT="${APP_ROOT:-${SCRATCH_DIR}/opt/homeroll}"

mkdir -p "${APP_ROOT}/compose" "${APP_ROOT}/env" "${SCRATCH_DIR}/bin"

# --- aws shim: force download_if_exists() to fail fast -----------------------
cat > "${SCRATCH_DIR}/bin/aws" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
chmod +x "${SCRATCH_DIR}/bin/aws"

# --- sudo shim: drop leading option flags, exec the rest with env intact -----
cat > "${SCRATCH_DIR}/bin/sudo" <<'EOF'
#!/usr/bin/env bash
# Passthrough `sudo` for the scratch harness ONLY. Strips leading flags
# (-E, -H, -n) and runs the command directly, so exported variables survive.
# Does not handle `-u <user>`; remote-deploy.sh does not use it.
while [[ "${1:-}" == -* ]]; do shift; done
exec "$@"
EOF
chmod +x "${SCRATCH_DIR}/bin/sudo"

# --- real base.yml, verbatim -------------------------------------------------
cp "${REPO}/infra/config/docker-compose/base.yml" "${APP_ROOT}/compose/base.yml"

# --- scratch.yml: prod.yml minus the arm64 pin, env_file repointed -----------
cat > "${APP_ROOT}/compose/scratch.yml" <<EOF
services:
  db:
    restart: unless-stopped
    env_file:
      - ${APP_ROOT}/env/scratch.env
    volumes:
      - pgdata_scratch:/var/lib/postgresql/data

  migrate:
    env_file:
      - ${APP_ROOT}/env/scratch.env
    environment:
      NODE_ENV: production
      POSTGRES_PORT: "5432"

  # Stand-in for the generated prod worker overlay
  # (infra/scripts/deploy/generate-prod-workers-compose.sh). Case 3b needs a
  # non-api backend service that the recreate loop can target; without one,
  # \`up -d --no-deps media-worker\` fails with "no such service" and masks the
  # API_IMAGE fallback we are actually testing.
  #
  # A stub image is deliberate. What is under test is remote-deploy.sh's control
  # flow — that migrate runs, that API_IMAGE falls back to the running api image
  # when this deploy built none — not the worker binary. Using the real worker
  # image would add a multi-minute build and change nothing about the result.
  # depends_on mirrors the generated overlay exactly.
  media-worker:
    image: alpine:3.20
    restart: unless-stopped
    command: ["sleep", "infinity"]
    depends_on:
      db:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully

  api:
    restart: unless-stopped
    env_file:
      - ${APP_ROOT}/env/scratch.env
    environment:
      NODE_ENV: production
      POSTGRES_PORT: "5432"
    ports:
      - "127.0.0.1:\${API_HOST_PORT:-3999}:\${API_PORT:-3000}"
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:3000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

volumes:
  pgdata_scratch:
EOF

# --- container env. NODE_ENV=production is deliberate: it also proves the ----
# --- seed guard would fire if anything on this path tried to seed. -----------
cat > "${APP_ROOT}/env/scratch.env" <<'EOF'
NODE_ENV=production
POSTGRES_USER=scratch
POSTGRES_PASSWORD=scratch
POSTGRES_DB=scratch
POSTGRES_HOST=db
POSTGRES_PORT=5432
API_HOST_PORT=3999
API_PORT=3000
PORT=3000
JWT_SECRET=scratch-not-a-real-secret
JWT_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
AWS_REGION=us-east-1
S3_BUCKET=scratch-bucket
FROM_EMAIL=scratch@example.com
FROM_NAME=Scratch
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
MEDIA_STORAGE_ROOT=/tmp/scratch-media
EOF

echo "Scratch tree ready:"
echo "  REPO=${REPO}"
echo "  SCRATCH_DIR=${SCRATCH_DIR}"
echo "  APP_ROOT=${APP_ROOT}"
echo "  compose: base.yml (real, verbatim) + scratch.yml"
echo "  shims:   ${SCRATCH_DIR}/bin/{aws,sudo}"
echo
echo "Still required (needs sudo, run once):"
echo "  sudo install -m 0755 ${HERE}/betaname-backup.sh /usr/local/bin/betaname-backup.sh"
