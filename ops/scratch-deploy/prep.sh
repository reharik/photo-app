#!/usr/bin/env bash
# Builds the scratch APP_ROOT tree that remote-deploy.sh expects, so the REAL
# script can run unmodified against a local stack.
#
# Everything generated goes under SCRATCH_DIR (default
# /tmp/homeroll-scratch-deploy) so nothing generated lands in the repo.
#
# Deviations from prod, and why each is unavoidable:
#   1. The compose file is DERIVED, not hand-written: the real
#      docker-compose-prod.yml with the arm64 pins stripped (dev boxes are
#      amd64), the env_file repointed, and the worker image stubbed. Everything
#      else — the migrate one-shot, restart:"no", the depends_on gates, the db
#      healthcheck, api's loopback bind and healthcheck — is the REAL shipping
#      definition rather than a copy that can drift. Each transform is asserted
#      after the fact, so formatting drift in the prod file fails loudly here
#      instead of producing a quietly-wrong scratch stack.
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
REPO="${REPO:-$(git rev-parse --show-toplevel)}"
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

# --- compose/docker-compose.yml: DERIVED from the real prod file -------------
# remote-deploy.sh reads exactly one file, ${APP_ROOT}/compose/docker-compose.yml,
# so that is what the harness stages. Old multi-file layouts are cleared first:
# they are inert now, but leaving them would misrepresent what the real host has.
rm -f "${APP_ROOT}/compose"/{base.yml,prod.yml,scratch.yml,workers.generated.yml}

PROD_COMPOSE="${REPO}/docker-compose-prod.yml"
SCRATCH_COMPOSE="${APP_ROOT}/compose/docker-compose.yml"
[[ -f "${PROD_COMPOSE}" ]] || {
  echo "Missing ${PROD_COMPOSE}" >&2
  exit 1
}

# Exactly three transforms, each asserted below:
#   1. drop `platform: linux/arm64`  — dev boxes are amd64
#   2. repoint env_file              — /opt/homeroll/env/prod.env is not here
#   3. stub the media-worker image   — a stub is deliberate: what is under test
#      is remote-deploy.sh's control flow (that migrate runs, that API_IMAGE
#      falls back to the running api image when this deploy built none), not the
#      worker binary. The real image would add a multi-minute build and change
#      nothing. depends_on/restart/env_file all survive from the prod file, so
#      case 3b still gets a non-api backend service the recreate loop can target.
#
# API_HOST_PORT/API_PORT need NO transform: prod's ports line is already
# `127.0.0.1:${API_HOST_PORT:-3000}:${API_PORT:-3000}`, and remote-deploy.sh
# passes --env-file scratch.env, which feeds compose interpolation.
sed \
  -e '/^[[:space:]]*platform: linux\/arm64$/d' \
  -e "s|/opt/homeroll/env/prod\.env|${APP_ROOT}/env/scratch.env|" \
  -e 's|^\( *\)image: homeroll-media-worker:.*$|\1image: alpine:3.20\n\1command: ["sleep", "infinity"]|' \
  "${PROD_COMPOSE}" > "${SCRATCH_COMPOSE}"

# A silently no-op'd sed would produce a scratch stack that looks fine and
# tests the wrong thing. Verify each transform actually landed.
transform_check() { # transform_check <label> <literal> <expected-count>
  local n
  n="$(grep -cF -- "$2" "${SCRATCH_COMPOSE}" || true)"
  if [[ "$n" != "$3" ]]; then
    echo "prep.sh: transform '$1' matched ${n}x, expected $3x." >&2
    echo "  ${PROD_COMPOSE} formatting has drifted; update the sed above." >&2
    exit 1
  fi
}
# Same contract, but the pattern is an ERE rather than a fixed string. Use this
# ONLY where a literal would pin us to a formatting choice we do not own: the
# fixed-string form above is the default precisely because most of these
# literals contain regex metacharacters (`["sleep", "infinity"]`, `alpine:3.20`,
# `127.0.0.1:`) that would silently change meaning under -E.
transform_check_re() { # transform_check_re <label> <ere> <expected-count>
  local n
  n="$(grep -cE -- "$2" "${SCRATCH_COMPOSE}" || true)"
  if [[ "$n" != "$3" ]]; then
    echo "prep.sh: transform '$1' matched ${n}x, expected $3x." >&2
    echo "  ${PROD_COMPOSE} formatting has drifted; update the sed above." >&2
    exit 1
  fi
}
transform_check "arm64 pins stripped"     "platform: linux/arm64"          0
transform_check "prod env_file removed"   "/opt/homeroll/env/prod.env"     0
transform_check "scratch env_file wired"  "${APP_ROOT}/env/scratch.env"    4
transform_check "worker image stubbed"    "image: alpine:3.20"             1
transform_check "worker sleeps"           'command: ["sleep", "infinity"]' 1
# Guards that the REAL definitions survived the transform.
# Quote-agnostic ON PURPOSE: prettier owns docker-compose-prod.yml's quote style
# and has already flipped this value from "no" to 'no' once. What must hold is
# that the migrate one-shot still carries a disabled restart policy, not which
# quotes YAML happens to be wearing this week. Still anchored start-to-end, so
# `unless-stopped` (or any other value) fails exactly as before.
transform_check_re "migrate one-shot intact" '^[[:space:]]*restart:[[:space:]]*["'"'"']?no["'"'"']?[[:space:]]*$' 1
transform_check "api loopback bind intact" "127.0.0.1:"                    1

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
echo "  compose: docker-compose.yml (derived from docker-compose-prod.yml)"
echo "  shims:   ${SCRATCH_DIR}/bin/{aws,sudo}"
echo
echo "Still required (needs sudo, run once):"
echo "  sudo install -m 0755 ${HERE}/betaname-backup.sh /usr/local/bin/betaname-backup.sh"
