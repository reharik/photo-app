#!/usr/bin/env bash
set -euo pipefail

: "${APP_NAME:?APP_NAME required}"
: "${ENV:?ENV required}"
: "${SHA:?SHA required}"
: "${APP_ROOT:?APP_ROOT required}"

CHANGED_SERVICE_NAMES="${CHANGED_SERVICE_NAMES:-}"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${APP_NAME}-${ENV}}"
COMPOSE_DIR="${APP_ROOT}/compose"
WORK_DIR="${APP_ROOT}/tmp/${SHA}"

echo "Remote deploy starting"
echo "  APP_NAME=${APP_NAME}"
echo "  ENV=${ENV}"
echo "  SHA=${SHA}"
echo "  APP_ROOT=${APP_ROOT}"
echo "  WORK_DIR=${WORK_DIR}"
echo "  CHANGED_SERVICE_NAMES=${CHANGED_SERVICE_NAMES}"

sudo mkdir -p "${APP_ROOT}/env" "${COMPOSE_DIR}" "${APP_ROOT}/tmp"

# Install compose files uploaded by CI.
sudo install -m 0644 "${WORK_DIR}/compose/base.yml" "${COMPOSE_DIR}/base.yml"
sudo install -m 0644 "${WORK_DIR}/compose/prod.yml" "${COMPOSE_DIR}/prod.yml"
sudo install -m 0644 "${WORK_DIR}/compose/workers.generated.yml" "${COMPOSE_DIR}/workers.generated.yml"

# Load only changed images.
for service in ${CHANGED_SERVICE_NAMES}; do
  TARBALL="${WORK_DIR}/${service}.tar.gz"
  if [[ -f "${TARBALL}" ]]; then
    echo "Loading image tarball for ${service}: ${TARBALL}"
    gunzip -c "${TARBALL}" | sudo docker load
  else
    echo "No tarball for ${service}; skipping docker load"
  fi
done

export APP_NAME
export API_IMAGE="${APP_NAME}-api:${SHA}"

echo "Running docker compose up -d"
echo "  project=${COMPOSE_PROJECT_NAME}"
echo "  compose files=${COMPOSE_DIR}/base.yml ${COMPOSE_DIR}/prod.yml ${COMPOSE_DIR}/workers.generated.yml"
echo "  API_IMAGE=${API_IMAGE}"

if docker compose version >/dev/null 2>&1; then
  sudo -E docker compose \
    -p "${COMPOSE_PROJECT_NAME}" \
    -f "${COMPOSE_DIR}/base.yml" \
    -f "${COMPOSE_DIR}/prod.yml" \
    -f "${COMPOSE_DIR}/workers.generated.yml" \
    up -d --force-recreate --remove-orphans
else
  sudo -E docker-compose \
    -p "${COMPOSE_PROJECT_NAME}" \
    -f "${COMPOSE_DIR}/base.yml" \
    -f "${COMPOSE_DIR}/prod.yml" \
    -f "${COMPOSE_DIR}/workers.generated.yml" \
    up -d --force-recreate --remove-orphans
fi

# Cleanup uploaded bundle for this SHA.
sudo rm -rf "${WORK_DIR}"

echo "Remote deploy complete"