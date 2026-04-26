#!/usr/bin/env bash
# Reset photo-app's database and S3 bucket without affecting other apps on the host.
#
# Targets only this app's docker resources by compose project label
# (com.docker.compose.project=$PROJECT_NAME), and empties the configured S3 bucket.
# Other docker projects on the host are untouched.
#
# Usage:
#   sudo ./reset-photo-app.sh                # interactive
#   sudo ./reset-photo-app.sh --yes          # non-interactive (for SSM)
#   sudo ./reset-photo-app.sh --no-restart   # tear down only, do not bring back up
#
# Overrides (flag or env var):
#   --app PHOTO_APP        APP_NAME           (default: photo-app)
#   --project NAME         PROJECT_NAME       (default: ${APP_NAME}-prod)
#   --bucket NAME          S3_BUCKET          (default: photoshare-dev-media-709865789463-use1)
#   --region NAME          AWS_REGION         (default: us-east-1)
#   --compose-dir PATH     COMPOSE_DIR        (default: /opt/${APP_NAME}/compose)
#   --api-host-port PORT   API_HOST_PORT      (default: 3000; use e.g. 3001 if host :3000 is taken)
#
# Run with bash (e.g. ./script.sh after chmod +x, or: sudo bash ./reset-photo-app.sh).
# `sh script.sh` uses dash on Ubuntu/Debian and will fail on pipefail unless re-exec'd.

if [ -z "${BASH_VERSION:-}" ]; then
  exec /usr/bin/env bash "$0" "$@"
fi

set -euo pipefail

APP_NAME="${APP_NAME:-photo-app}"
PROJECT_NAME="${PROJECT_NAME:-}"
S3_BUCKET="${S3_BUCKET:-photoshare-dev-media-709865789463-use1}"
AWS_REGION="${AWS_REGION:-us-east-1}"
COMPOSE_DIR="${COMPOSE_DIR:-}"
RESTART="${RESTART:-true}"
ASSUME_YES="${ASSUME_YES:-false}"
API_HOST_PORT="${API_HOST_PORT:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -y|--yes) ASSUME_YES=true; shift;;
    --no-restart) RESTART=false; shift;;
    --app) APP_NAME="$2"; shift 2;;
    --project) PROJECT_NAME="$2"; shift 2;;
    --bucket) S3_BUCKET="$2"; shift 2;;
    --region) AWS_REGION="$2"; shift 2;;
    --compose-dir) COMPOSE_DIR="$2"; shift 2;;
    --api-host-port) API_HOST_PORT="$2"; shift 2;;
    -h|--help) sed -n '2,22p' "$0"; exit 0;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

PROJECT_NAME="${PROJECT_NAME:-${APP_NAME}-prod}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/${APP_NAME}/compose}"
API_HOST_PORT="${API_HOST_PORT:-3000}"

log() { printf '[reset-photo-app] %s\n' "$*"; }

log "APP_NAME=${APP_NAME}"
log "PROJECT_NAME=${PROJECT_NAME}"
log "S3_BUCKET=${S3_BUCKET}"
log "AWS_REGION=${AWS_REGION}"
log "COMPOSE_DIR=${COMPOSE_DIR}"
log "API_HOST_PORT=${API_HOST_PORT}"
log "RESTART=${RESTART}"

if [[ "${ASSUME_YES}" != "true" ]]; then
  printf '\nThis will DELETE:\n'
  printf '  - all containers labeled com.docker.compose.project=%s\n' "${PROJECT_NAME}"
  printf '  - all volumes labeled com.docker.compose.project=%s (including Postgres data)\n' "${PROJECT_NAME}"
  printf '  - ALL objects in s3://%s/\n' "${S3_BUCKET}"
  printf '\nOther docker projects on this host will not be touched.\n\n'
  read -rp "Continue? [y/N] " ans
  if [[ "${ans}" != "y" && "${ans}" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

log "Removing containers for project ${PROJECT_NAME}"
container_ids="$(docker ps -a --filter "label=com.docker.compose.project=${PROJECT_NAME}" -q || true)"
if [[ -n "${container_ids}" ]]; then
  echo "${container_ids}" | xargs docker rm -f
else
  log "  (none)"
fi

log "Removing volumes for project ${PROJECT_NAME}"
volume_names="$(docker volume ls --filter "label=com.docker.compose.project=${PROJECT_NAME}" -q || true)"
if [[ -n "${volume_names}" ]]; then
  echo "${volume_names}" | xargs docker volume rm
else
  log "  (none)"
fi

log "Emptying s3://${S3_BUCKET}/"
aws s3 rm "s3://${S3_BUCKET}/" --recursive --region "${AWS_REGION}" || {
  echo "WARN: aws s3 rm failed (bucket may already be empty or not accessible)" >&2
}

if [[ "${RESTART}" != "true" ]]; then
  log "Skipping restart (--no-restart). Done."
  exit 0
fi

if [[ ! -d "${COMPOSE_DIR}" ]]; then
  echo "Compose dir not found: ${COMPOSE_DIR}" >&2
  echo "Cannot restart automatically. Trigger a deploy via CI or run compose manually." >&2
  exit 1
fi

COMPOSE_FILES=()
for f in base prod workers.generated; do
  if [[ -f "${COMPOSE_DIR}/${f}.yml" ]]; then
    COMPOSE_FILES+=( -f "${COMPOSE_DIR}/${f}.yml" )
  fi
done

if [[ ${#COMPOSE_FILES[@]} -eq 0 ]]; then
  echo "No compose files found in ${COMPOSE_DIR}; cannot restart." >&2
  exit 1
fi

IMG="$(docker images "${APP_NAME}-api" --format '{{.Repository}}:{{.Tag}}' \
  | grep -v '<none>' \
  | head -1 || true)"
if [[ -z "${IMG}" ]]; then
  echo "No ${APP_NAME}-api image found locally; trigger a deploy via CI to bring it back up." >&2
  exit 1
fi
log "Bringing stack back up using image ${IMG}"

APP_NAME="${APP_NAME}" API_IMAGE="${IMG}" API_HOST_PORT="${API_HOST_PORT}" \
  docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" up -d

log "Done."
