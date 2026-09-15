#!/usr/bin/env bash
# Emits shell-assignable variables for CI (source or eval in GitHub Actions).
# Determines which backend services and frontend need work for this revision.
set -euo pipefail

FORCE_FULL_BACKEND="${FORCE_FULL_BACKEND:-false}"
DEPLOY_BACKEND="${DEPLOY_BACKEND:-true}"
DEPLOY_FRONTEND="${DEPLOY_FRONTEND:-true}"
BASE_SHA="${BASE_SHA:-}"
HEAD_SHA="${HEAD_SHA:-HEAD}"

# Full service list from infra config (api + workers).
CONFIG_PATH="${1:-infra.app.config.json}"
APP_WORKSPACE_PATH="${DOCKER_APP_WORKSPACE_PATH:-apps/api}"
WORKERS_JSON="${DOCKER_WORKERS_JSON:-[]}"

log() { echo "$@" >&2; }

all_backend_service_names() {
  echo "api"
  jq -r '.[].name' <<<"$WORKERS_JSON" 2>/dev/null || true
}

mark_service() {
  local name="$1"
  case " ${BACKEND_SERVICES} " in
    *" ${name} "*) ;;
    *) BACKEND_SERVICES="${BACKEND_SERVICES} ${name}" ;;
  esac
}

# Mark every backend service (api + each configured worker). Factored out so the
# arms below and the three whole-world branches at the bottom share one copy of
# the list instead of each carrying its own.
#
# The explicit `return 0` is load-bearing under `set -e`: if the final line read
# from all_backend_service_names is empty, `[[ -n "$svc" ]]` is false, the `&&`
# short-circuits, and the function would otherwise return that non-zero status
# and abort the script.
mark_all_backend_services() {
  local svc
  while IFS= read -r svc; do
    [[ -n "$svc" ]] && mark_service "$svc"
  done < <(all_backend_service_names)
  return 0
}

classify_path() {
  local path="$1"

  case "$path" in
    apps/web/*)
      FRONTEND_CHANGED=true
      ;;
    # The shared Caddyfile is shipped by the FRONTEND job (deploy.yml uploads it
    # to s3://<bucket>/deployments/shared/Caddyfile), so it has to set
    # FRONTEND_CHANGED itself. It previously had no arm at all and reached the
    # safety fallback below, which only fires when BACKEND_SERVICES is empty --
    # so a Caddyfile-ONLY commit shipped by accident, while a commit touching
    # the Caddyfile AND any backend path marked that service, left the fallback
    # un-fired, and silently never shipped the Caddyfile at all.
    #
    # Deliberately marks no backend service: the shared proxy reads this file;
    # no image contains it and nothing needs rebuilding.
    ops/caddy/*)
      FRONTEND_CHANGED=true
      ;;
    apps/api/*)
      mark_service api
      ;;
    apps/media-worker/*)
      mark_service media-worker
      ;;
    packages/context/media-core/* | packages/foundation/*)
      mark_service api
      mark_service media-worker
      ;;
    packages/context/heic-converter/*)
      mark_service media-worker
      ;;
    # AFFECTS EVERYTHING -- every backend image AND the frontend bundle.
    #
    # The frontend is NOT built from a Docker image: the deploy workflow runs
    # `npm ci` + `npm run build:web` on the runner and ships apps/web/dist as a
    # tarball. So anything feeding BOTH that runner build and the image build
    # belongs here:
    #   tooling/*          nx.json + the tsconfig base. Copied into the image by
    #                      docker/Dockerfile (`COPY tooling tooling`) AND what
    #                      `npm run build:web` compiles against -- apps/web's
    #                      tsconfig extends root tsconfig.base.json, which
    #                      extends tooling/tsconfig/tsconfig.base.json.
    #   package.json
    #   package-lock.json  feed `npm ci` in the image build and on the runner.
    #
    # package.json / package-lock.json were previously in the backend-only arm
    # below, which marked services but left FRONTEND_CHANGED false -- so a
    # lockfile-only commit rebuilt every backend and shipped a frontend still
    # built from the OLD dependency versions. Same silent-skew class as the
    # Caddyfile bug above.
    tooling/* | package.json | package-lock.json)
      mark_all_backend_services
      FRONTEND_CHANGED=true
      ;;
    # BACKEND-ONLY global inputs.
    #
    # docker/* stays here on purpose: it only shapes the container images. The
    # frontend is the runner-built tarball described above, served by Caddy from
    # /srv/homeroll -- the Dockerfile's `runtime-web` nginx target is not in this
    # deployment path, so a Dockerfile change cannot alter what the frontend
    # serves.
    #
    # docker-compose-prod.yml ONLY. It is the file that ships to the host, and
    # marking every backend service is how a compose-only change gets a deploy
    # at all (no marked service => no deploy job => the new file never reaches
    # the box). The dev and CI compose files are deliberately NOT listed: they
    # never leave the repo, so a change to either must not trigger a prod
    # rebuild. The old `infra/config/docker-compose/*` glob could not draw that
    # distinction and rebuilt everything for a dev-only edit.
    docker/* | docker-compose-prod.yml | infra.app.config.json)
      mark_all_backend_services
      ;;
    ops/deploy/* | ops/remote/*)
      # Deploy plumbing only; does not require rebuilding images.
      ;;
    *)
      ;;
  esac
}

BACKEND_SERVICES=""
FRONTEND_CHANGED=false

if [[ "$FORCE_FULL_BACKEND" == "true" ]]; then
  log "FORCE_FULL_BACKEND=true: building all backend services"
  mark_all_backend_services
  FRONTEND_CHANGED=true
elif [[ -z "$BASE_SHA" || "$BASE_SHA" == "0000000000000000000000000000000000000000" ]]; then
  log "No BASE_SHA (initial push or unavailable): building all backend services"
  mark_all_backend_services
  FRONTEND_CHANGED=true
else
  log "Diffing ${BASE_SHA}..${HEAD_SHA}"
  while IFS= read -r path; do
    [[ -n "$path" ]] && classify_path "$path"
  done < <(git diff --name-only "${BASE_SHA}" "${HEAD_SHA}" 2>/dev/null || true)

  if [[ -z "${BACKEND_SERVICES// }" && "$FRONTEND_CHANGED" != "true" ]]; then
    log "No recognized path changes; building all backend services (safety fallback)"
    mark_all_backend_services
    FRONTEND_CHANGED=true
  fi
fi

# Trim leading space
BACKEND_SERVICES="${BACKEND_SERVICES# }"

if [[ "$DEPLOY_FRONTEND" == "true" && "$FRONTEND_CHANGED" != "true" && "$FORCE_FULL_BACKEND" != "true" ]]; then
  # workflow_dispatch may request frontend deploy without file changes
  if [[ "${GITHUB_EVENT_NAME:-}" == "workflow_dispatch" ]]; then
    FRONTEND_CHANGED=true
  fi
fi

SHOULD_BUILD_BACKEND=false
SHOULD_DEPLOY_BACKEND=false
if [[ "$DEPLOY_BACKEND" == "true" && -n "${BACKEND_SERVICES// }" ]]; then
  SHOULD_BUILD_BACKEND=true
  SHOULD_DEPLOY_BACKEND=true
fi

BUILD_MATRIX="$(
  jq -cn \
    --arg apiPath "$APP_WORKSPACE_PATH" \
    --arg workersJson "$WORKERS_JSON" \
    --arg backendServices "$BACKEND_SERVICES" '
      def wanted($name): ($backendServices | split(" ") | index($name)) != null;
      [
        (if wanted("api") then { name: "api", workspacePath: $apiPath } else empty end)
      ] + (
        ($workersJson | fromjson | map(select(wanted(.name))))
      )
    '
)"

CHANGED_SERVICE_NAMES="$BACKEND_SERVICES"

log "BACKEND_SERVICES=${CHANGED_SERVICE_NAMES:-<none>}"
log "FRONTEND_CHANGED=${FRONTEND_CHANGED}"
log "SHOULD_BUILD_BACKEND=${SHOULD_BUILD_BACKEND}"
log "BUILD_MATRIX=${BUILD_MATRIX}"

cat <<EOF
BACKEND_SERVICES='${CHANGED_SERVICE_NAMES}'
CHANGED_SERVICE_NAMES='${CHANGED_SERVICE_NAMES}'
FRONTEND_CHANGED='${FRONTEND_CHANGED}'
SHOULD_BUILD_BACKEND='${SHOULD_BUILD_BACKEND}'
SHOULD_DEPLOY_BACKEND='${SHOULD_DEPLOY_BACKEND}'
BUILD_MATRIX='${BUILD_MATRIX}'
EOF
