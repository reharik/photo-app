#!/usr/bin/env bash
set -euo pipefail

: "${APP_NAME:?APP_NAME required}"
: "${ENV:?ENV required}"
: "${SHA:?SHA required}"
: "${AWS_REGION:?AWS_REGION required}"
: "${S3_BUCKET:?S3_BUCKET required}"

CHANGED_SERVICE_NAMES="${CHANGED_SERVICE_NAMES:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# common.sh is uploaded via subtree/shared infra in the repo on the instance only if present there.
# For SSM execution from /tmp, do not rely on relative source from CI upload.
# Instead, reproduce only the needed conventions here.

APP_ROOT="${APP_ROOT:-/opt/${APP_NAME}}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${APP_NAME}-${ENV}}"
COMPOSE_DIR="${COMPOSE_DIR:-${APP_ROOT}/compose}"
ENV_FILE="${ENV_FILE:-${APP_ROOT}/env/${ENV}.env}"
S3_PREFIX="${S3_PREFIX:-deployments/${APP_NAME}/${SHA}}"
S3_URI="s3://${S3_BUCKET}/${S3_PREFIX}"
WORK_DIR="${WORK_DIR:-${APP_ROOT}/tmp/${SHA}}"

mkdir -p "${WORK_DIR}" "${COMPOSE_DIR}" "${APP_ROOT}/env" "${APP_ROOT}/tmp"
trap 'rm -rf "${WORK_DIR}"' EXIT

echo "Remote deploy starting"
echo "  APP_NAME=${APP_NAME}"
echo "  ENV=${ENV}"
echo "  SHA=${SHA}"
echo "  S3_URI=${S3_URI}"
echo "  CHANGED_SERVICE_NAMES=${CHANGED_SERVICE_NAMES}"

aws s3 cp "${S3_URI}/compose/base.yml" "${WORK_DIR}/base.yml" --region "${AWS_REGION}"
aws s3 cp "${S3_URI}/compose/prod.yml" "${WORK_DIR}/prod.yml" --region "${AWS_REGION}"
aws s3 cp "${S3_URI}/compose/workers.generated.yml" "${WORK_DIR}/workers.generated.yml" --region "${AWS_REGION}"

install -m 0644 "${WORK_DIR}/base.yml" "${COMPOSE_DIR}/base.yml"
install -m 0644 "${WORK_DIR}/prod.yml" "${COMPOSE_DIR}/prod.yml"
install -m 0644 "${WORK_DIR}/workers.generated.yml" "${COMPOSE_DIR}/workers.generated.yml"

for service in ${CHANGED_SERVICE_NAMES}; do
  if aws s3 ls "${S3_URI}/${service}.tar.gz" --region "${AWS_REGION}" >/dev/null 2>&1; then
    echo "Downloading ${service}.tar.gz"
    aws s3 cp "${S3_URI}/${service}.tar.gz" "${WORK_DIR}/${service}.tar.gz" --region "${AWS_REGION}"
    echo "Loading ${service} image"
    gunzip -c "${WORK_DIR}/${service}.tar.gz" | docker load
  else
    echo "No tarball for ${service}, skipping"
  fi
done

export APP_NAME
export API_IMAGE="${APP_NAME}-api:${SHA}"

docker compose \
  -p "${COMPOSE_PROJECT_NAME}" \
  -f "${COMPOSE_DIR}/base.yml" \
  -f "${COMPOSE_DIR}/prod.yml" \
  -f "${COMPOSE_DIR}/workers.generated.yml" \
  up -d --force-recreate --remove-orphans

echo "Remote deploy complete"