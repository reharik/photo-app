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

classify_path() {
  local path="$1"

  case "$path" in
    apps/web/*)
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
    package.json | package-lock.json | infra/docker/* | infra/config/docker-compose/* | infra.app.config.json)
      while IFS= read -r svc; do
        [[ -n "$svc" ]] && mark_service "$svc"
      done < <(all_backend_service_names)
      ;;
    infra/scripts/deploy/* | infra/scripts/remote/*)
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
  while IFS= read -r svc; do
    [[ -n "$svc" ]] && mark_service "$svc"
  done < <(all_backend_service_names)
  FRONTEND_CHANGED=true
elif [[ -z "$BASE_SHA" || "$BASE_SHA" == "0000000000000000000000000000000000000000" ]]; then
  log "No BASE_SHA (initial push or unavailable): building all backend services"
  while IFS= read -r svc; do
    [[ -n "$svc" ]] && mark_service "$svc"
  done < <(all_backend_service_names)
  FRONTEND_CHANGED=true
else
  log "Diffing ${BASE_SHA}..${HEAD_SHA}"
  while IFS= read -r path; do
    [[ -n "$path" ]] && classify_path "$path"
  done < <(git diff --name-only "${BASE_SHA}" "${HEAD_SHA}" 2>/dev/null || true)

  if [[ -z "${BACKEND_SERVICES// }" && "$FRONTEND_CHANGED" != "true" ]]; then
    log "No recognized path changes; building all backend services (safety fallback)"
    while IFS= read -r svc; do
      [[ -n "$svc" ]] && mark_service "$svc"
    done < <(all_backend_service_names)
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
