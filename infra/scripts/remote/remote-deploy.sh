#!/usr/bin/env bash
set -euo pipefail

: "${APP_NAME:?APP_NAME required}"
: "${ENV:?ENV required}"
: "${SHA:?SHA required}"
: "${AWS_REGION:?AWS_REGION required}"
: "${S3_BUCKET:?S3_BUCKET required}"

DEPLOY_BACKEND="${DEPLOY_BACKEND:-true}"
DEPLOY_FRONTEND="${DEPLOY_FRONTEND:-true}"
CHANGED_SERVICE_NAMES="${CHANGED_SERVICE_NAMES:-}"

APP_ROOT="${APP_ROOT:-/opt/${APP_NAME}}"
FRONTEND_DIR="${FRONTEND_DIR:-${APP_ROOT}/frontend}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${APP_NAME}-${ENV}}"
COMPOSE_DIR="${APP_ROOT}/compose"

S3_PREFIX="${S3_PREFIX:-deployments/${APP_NAME}/${SHA}}"
S3_URI="s3://${S3_BUCKET}/${S3_PREFIX}"

FRONTEND_TAR="${FRONTEND_TAR:-frontend.tar.gz}"
REMOTE_COMPOSE_NAME="${REMOTE_COMPOSE_NAME:-docker-compose.yml}"
REMOTE_ENV_NAME="${REMOTE_ENV_NAME:-env.env}"
WORKERS_GENERATED_NAME="${WORKERS_GENERATED_NAME:-workers.generated.yml}"

WORK_DIR="${WORK_DIR:-${APP_ROOT}/tmp/${SHA}}"
sudo mkdir -p "${WORK_DIR}"
trap 'sudo rm -rf "$WORK_DIR"' EXIT

echo "Remote deploy starting"
echo "  APP_NAME=${APP_NAME}"
echo "  ENV=${ENV}"
echo "  SHA=${SHA}"
echo "  API_IMAGE=${API_IMAGE:-<unset; compose uses default image tag>}"
echo "  APP_ROOT=${APP_ROOT}"
echo "  S3=${S3_URI}"
echo "  DEPLOY_BACKEND=${DEPLOY_BACKEND}"
echo "  DEPLOY_FRONTEND=${DEPLOY_FRONTEND}"
echo "  CHANGED_SERVICE_NAMES=${CHANGED_SERVICE_NAMES}"
echo "  WORK_DIR=${WORK_DIR}"

sudo mkdir -p "${APP_ROOT}/env" "${APP_ROOT}/compose" "${APP_ROOT}/tmp"

download_if_exists() {
  local remote_name="$1"
  local local_path="$2"

  if aws s3 ls "${S3_URI}/${remote_name}" --region "${AWS_REGION}" >/dev/null 2>&1; then
    echo "Downloading ${remote_name} -> ${local_path}"
    aws s3 cp "${S3_URI}/${remote_name}" "${local_path}" --region "${AWS_REGION}"
    [[ -f "${local_path}" ]] || {
      echo "Download failed: ${local_path} not found after copy" >&2
      return 1
    }
    return 0
  fi
  return 1
}

download_prefix_if_exists() {
  local remote_prefix="$1"
  local local_dir="$2"

  if aws s3 ls "${S3_URI}/${remote_prefix}/" --region "${AWS_REGION}" >/dev/null 2>&1; then
    echo "Downloading prefix ${remote_prefix}/ -> ${local_dir}/"
    mkdir -p "${local_dir}"
    aws s3 cp "${S3_URI}/${remote_prefix}/" "${local_dir}/" --recursive --region "${AWS_REGION}"
    return 0
  fi
  return 1
}

ENV_FILE="${ENV_FILE:-${APP_ROOT}/env/${ENV}.env}"
if download_if_exists "${REMOTE_ENV_NAME}" "${WORK_DIR}/${REMOTE_ENV_NAME}"; then
  echo "Installing env file to ${ENV_FILE}"
  sudo mkdir -p "$(dirname "${ENV_FILE}")"
  sudo install -m 0600 "${WORK_DIR}/${REMOTE_ENV_NAME}" "${ENV_FILE}"
fi

if download_prefix_if_exists "compose" "${WORK_DIR}/compose"; then
  echo "Installing compose directory to ${COMPOSE_DIR}"
  sudo mkdir -p "${COMPOSE_DIR}"
  shopt -s nullglob
  files=( "${WORK_DIR}/compose/"*.yml "${WORK_DIR}/compose/"*.yaml )
  shopt -u nullglob
  if (( ${#files[@]} > 0 )); then
    sudo cp -f "${files[@]}" "${COMPOSE_DIR}/"
  else
    echo "WARN: compose/ prefix existed in S3 but no .yml/.yaml files were downloaded" >&2
  fi
fi

COMPOSE_FILES=()

if [[ -f "${COMPOSE_DIR}/base.yml" && -f "${COMPOSE_DIR}/${ENV}.yml" ]]; then
  COMPOSE_FILES=( -f "${COMPOSE_DIR}/base.yml" -f "${COMPOSE_DIR}/${ENV}.yml" )
  echo "Using compose dir files: ${COMPOSE_DIR}/base.yml + ${COMPOSE_DIR}/${ENV}.yml"
  if [[ -f "${COMPOSE_DIR}/${WORKERS_GENERATED_NAME}" ]]; then
    COMPOSE_FILES+=( -f "${COMPOSE_DIR}/${WORKERS_GENERATED_NAME}" )
    echo "Also: ${COMPOSE_DIR}/${WORKERS_GENERATED_NAME}"
  fi
elif [[ -f "${COMPOSE_DIR}/base.yml" && -f "${COMPOSE_DIR}/prod.yml" ]]; then
  COMPOSE_FILES=( -f "${COMPOSE_DIR}/base.yml" -f "${COMPOSE_DIR}/prod.yml" )
  echo "Using compose dir files: ${COMPOSE_DIR}/base.yml + ${COMPOSE_DIR}/prod.yml"
  if [[ -f "${COMPOSE_DIR}/${WORKERS_GENERATED_NAME}" ]]; then
    COMPOSE_FILES+=( -f "${COMPOSE_DIR}/${WORKERS_GENERATED_NAME}" )
    echo "Also: ${COMPOSE_DIR}/${WORKERS_GENERATED_NAME}"
  fi
else
  COMPOSE_FILE_DEFAULT_1="${APP_ROOT}/docker-compose.${ENV}.yml"
  COMPOSE_FILE_DEFAULT_2="${APP_ROOT}/docker-compose.prod.yml"
  COMPOSE_FILE_DEFAULT_3="${APP_ROOT}/docker-compose.yml"
  COMPOSE_FILE="${COMPOSE_FILE:-${COMPOSE_FILE_DEFAULT_1}}"

  if download_if_exists "${REMOTE_COMPOSE_NAME}" "${WORK_DIR}/${REMOTE_COMPOSE_NAME}"; then
    echo "Installing compose file to ${APP_ROOT}/docker-compose.yml"
    sudo install -m 0644 "${WORK_DIR}/${REMOTE_COMPOSE_NAME}" "${APP_ROOT}/docker-compose.yml"
    COMPOSE_FILE="${APP_ROOT}/docker-compose.yml"
  else
    if [[ -f "${COMPOSE_FILE_DEFAULT_1}" ]]; then
      COMPOSE_FILE="${COMPOSE_FILE_DEFAULT_1}"
    elif [[ -f "${COMPOSE_FILE_DEFAULT_2}" ]]; then
      COMPOSE_FILE="${COMPOSE_FILE_DEFAULT_2}"
    elif [[ -f "${COMPOSE_FILE_DEFAULT_3}" ]]; then
      COMPOSE_FILE="${COMPOSE_FILE_DEFAULT_3}"
    fi
  fi

  COMPOSE_FILES=( -f "${COMPOSE_FILE}" )
  echo "Using legacy compose file: ${COMPOSE_FILE}"
fi

if [[ "${DEPLOY_BACKEND}" == "true" ]]; then
  for service in ${CHANGED_SERVICE_NAMES}; do
    TARBALL_NAME="${service}.tar.gz"
    TARBALL_PATH="${WORK_DIR}/${TARBALL_NAME}"
    IMAGE_TAR_PATH="${WORK_DIR}/${service}.tar"

    if download_if_exists "${TARBALL_NAME}" "${TARBALL_PATH}"; then
      echo "Preparing backend image from ${TARBALL_NAME}"
      gunzip -c "${TARBALL_PATH}" > "${IMAGE_TAR_PATH}"
      [[ -f "${IMAGE_TAR_PATH}" ]] || {
        echo "Decompression failed: ${IMAGE_TAR_PATH} missing" >&2
        exit 1
      }

      echo "Loading backend image from ${IMAGE_TAR_PATH}"
      sudo docker load -i "${IMAGE_TAR_PATH}"

      rm -f "${IMAGE_TAR_PATH}" "${TARBALL_PATH}"
    else
      echo "No backend artifact (${TARBALL_NAME}) found; skipping"
    fi
  done
fi

if [[ "${DEPLOY_FRONTEND}" == "true" ]]; then
  if download_if_exists "${FRONTEND_TAR}" "${WORK_DIR}/${FRONTEND_TAR}"; then
    echo "Deploying frontend to ${FRONTEND_DIR}"
    sudo mkdir -p "${FRONTEND_DIR}"
    sudo find "${FRONTEND_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    sudo tar -xzf "${WORK_DIR}/${FRONTEND_TAR}" -C "${FRONTEND_DIR}"
  else
    echo "No frontend artifact (${FRONTEND_TAR}) found; skipping frontend deploy"
  fi
fi

if [[ "${DEPLOY_BACKEND}" == "true" ]]; then
  ENV_ARGS=()
  if [[ -f "${ENV_FILE}" ]]; then
    ENV_ARGS+=( --env-file "${ENV_FILE}" )
  fi

  export APP_NAME
  export API_IMAGE="${APP_NAME}-api:${SHA}"

  echo "docker compose up"
  echo "  project=${COMPOSE_PROJECT_NAME}"
  echo "  files=${COMPOSE_FILES[*]}"
  if [[ ${#ENV_ARGS[@]} > 0 ]]; then
    echo "  env_args=${ENV_ARGS[*]}"
  fi

  if docker compose version >/dev/null 2>&1; then
    sudo -E docker compose -p "${COMPOSE_PROJECT_NAME}" "${COMPOSE_FILES[@]}" "${ENV_ARGS[@]}" up -d --force-recreate --remove-orphans
  else
    sudo -E docker-compose -p "${COMPOSE_PROJECT_NAME}" "${COMPOSE_FILES[@]}" "${ENV_ARGS[@]}" up -d --force-recreate --remove-orphans
  fi
else
  echo "Skipping docker compose (DEPLOY_BACKEND=false): static/artifact deploy only; no container recreate."
fi

echo "Remote deploy complete"
