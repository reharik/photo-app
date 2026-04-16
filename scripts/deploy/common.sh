#!/usr/bin/env bash
# infra/scripts/deploy/common.sh
# Sourced by deploy scripts. Do not include `set -euo pipefail` here.

: "${APP_NAME:?APP_NAME required}"
: "${ENV:?ENV required}"
: "${SHA:?SHA required}"

# ------------------------------------------------------------------------------
# Conventions (override by exporting before sourcing if needed)
# ------------------------------------------------------------------------------

APP_ROOT="${APP_ROOT:-/opt/${APP_NAME}}"
SHARED_ROOT="${SHARED_ROOT:-/opt/shared}"
FRONTEND_DIR="${FRONTEND_DIR:-${APP_ROOT}/frontend}"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${APP_NAME}-${ENV}}"

# Option A compose layout on EC2:
#   ${APP_ROOT}/compose/base.yml
#   ${APP_ROOT}/compose/prod.yml   (or ${APP_ROOT}/compose/${ENV}.yml)
COMPOSE_DIR="${COMPOSE_DIR:-${APP_ROOT}/compose}"
COMPOSE_BASE_FILE="${COMPOSE_BASE_FILE:-${COMPOSE_DIR}/base.yml}"
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-${COMPOSE_DIR}/${ENV}.yml}"
COMPOSE_PROD_FILE="${COMPOSE_PROD_FILE:-${COMPOSE_DIR}/prod.yml}"

# Host env file (secrets live on the instance)
ENV_FILE_DEFAULT="${APP_ROOT}/env/${ENV}.env"
ENV_FILE="${ENV_FILE:-${ENV_FILE_DEFAULT}}"

# S3 conventions
S3_PREFIX="${S3_PREFIX:-deployments/${APP_NAME}/${SHA}}"

# Artifact names in S3
BACKEND_TAR="${BACKEND_TAR:-backend.tar.gz}"
WORKERS_TAR="${WORKERS_TAR:-workers.tar.gz}"
FRONTEND_TAR="${FRONTEND_TAR:-frontend.tar.gz}"

# Remote artifact locations after download/extract (conventions)
REMOTE_COMPOSE_DIR="${REMOTE_COMPOSE_DIR:-${APP_ROOT}/compose}"

# Optional: migrations command
MIGRATIONS_CMD="${MIGRATIONS_CMD:-}"

# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------

# Resolve which compose files to use for the current ENV.
# Prefers base + ${ENV}.yml, else base + prod.yml.
resolve_compose_files() {
  if [[ -f "${COMPOSE_BASE_FILE}" && -f "${COMPOSE_ENV_FILE}" ]]; then
    echo "${COMPOSE_BASE_FILE}:${COMPOSE_ENV_FILE}"
    return 0
  fi
  if [[ -f "${COMPOSE_BASE_FILE}" && -f "${COMPOSE_PROD_FILE}" ]]; then
    echo "${COMPOSE_BASE_FILE}:${COMPOSE_PROD_FILE}"
    return 0
  fi

  echo "ERROR: Expected compose files not found on host." >&2
  echo "  Looked for:" >&2
  echo "    ${COMPOSE_BASE_FILE}" >&2
  echo "    ${COMPOSE_ENV_FILE} (preferred) OR ${COMPOSE_PROD_FILE}" >&2
  return 1
}

# Run docker compose with the resolved files.
docker_compose() {
  local files
  files="$(resolve_compose_files)" || exit 1

  # Support multiple compose files via COMPOSE_FILE (colon-separated)
  COMPOSE_FILE="$files" docker compose -p "${COMPOSE_PROJECT_NAME}" "$@"
}