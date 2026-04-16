#!/usr/bin/env bash
set -euo pipefail

: "${APP_NAME:?APP_NAME required}"
: "${ENV:?ENV required}"
: "${SHA:?SHA required}"
: "${AWS_REGION:?AWS_REGION required}"
: "${S3_BUCKET:?S3_BUCKET required}"

DEPLOY_BACKEND="${DEPLOY_BACKEND:-true}"
DEPLOY_FRONTEND="${DEPLOY_FRONTEND:-true}"

# Conventions (override via env if you want)
APP_ROOT="${APP_ROOT:-/opt/${APP_NAME}}"
FRONTEND_DIR="${FRONTEND_DIR:-${APP_ROOT}/frontend}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${APP_NAME}-${ENV}}"
COMPOSE_DIR="${APP_ROOT}/compose"

# Where deploy.sh uploaded artifacts
S3_PREFIX="${S3_PREFIX:-deployments/${APP_NAME}/${SHA}}"
S3_URI="s3://${S3_BUCKET}/${S3_PREFIX}"

# Artifact names (must match deploy.sh)
BACKEND_TAR="${BACKEND_TAR:-backend.tar.gz}"
FRONTEND_TAR="${FRONTEND_TAR:-frontend.tar.gz}"
REMOTE_COMPOSE_NAME="${REMOTE_COMPOSE_NAME:-docker-compose.yml}"
REMOTE_ENV_NAME="${REMOTE_ENV_NAME:-env.env}"

# Local paths
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
echo "  WORK_DIR=${WORK_DIR}"

# Compose uses env_file: /opt/${APP_NAME}/env/${ENV}.env; that path must exist even when
# env.env is not shipped from S3 (secrets provisioned manually on the host).
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
  local remote_prefix="$1"  # e.g. "compose"
  local local_dir="$2"

  if aws s3 ls "${S3_URI}/${remote_prefix}/" --region "${AWS_REGION}" >/dev/null 2>&1; then
    echo "Downloading prefix ${remote_prefix}/ -> ${local_dir}/"
    mkdir -p "${local_dir}"
    aws s3 cp "${S3_URI}/${remote_prefix}/" "${local_dir}/" --recursive --region "${AWS_REGION}"
    return 0
  fi
  return 1
}

# ------------------------------------------------------------------------------
# Optional env file install (legacy mechanism; OK to keep)
# NOTE: In prod you may already use env_file: /opt/${APP_NAME}/env/prod.env in compose.
# Keeping this allows CI to optionally ship an env file if you want.
# ------------------------------------------------------------------------------
ENV_FILE="${ENV_FILE:-${APP_ROOT}/env/${ENV}.env}"
if download_if_exists "${REMOTE_ENV_NAME}" "${WORK_DIR}/${REMOTE_ENV_NAME}"; then
  echo "Installing env file to ${ENV_FILE}"
  sudo mkdir -p "$(dirname "${ENV_FILE}")"
  sudo install -m 0600 "${WORK_DIR}/${REMOTE_ENV_NAME}" "${ENV_FILE}"
fi

# ------------------------------------------------------------------------------
# Option A: install compose directory (compose/base.yml + compose/prod.yml or compose/${ENV}.yml)
# ------------------------------------------------------------------------------
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

# ------------------------------------------------------------------------------
# Decide which compose files to use
# Prefer Option A (compose dir) if base.yml + (ENV.yml or prod.yml) exist.
# Otherwise fall back to legacy single-file behavior (downloaded compose or pre-existing).
# ------------------------------------------------------------------------------
COMPOSE_FILES=()

if [[ -f "${COMPOSE_DIR}/base.yml" && -f "${COMPOSE_DIR}/${ENV}.yml" ]]; then
  COMPOSE_FILES=( -f "${COMPOSE_DIR}/base.yml" -f "${COMPOSE_DIR}/${ENV}.yml" )
  echo "Using compose dir files: ${COMPOSE_DIR}/base.yml + ${COMPOSE_DIR}/${ENV}.yml"
  if [[ -f "${COMPOSE_DIR}/prod.extend.yml" ]]; then
    COMPOSE_FILES+=( -f "${COMPOSE_DIR}/prod.extend.yml" )
    echo "Also: ${COMPOSE_DIR}/prod.extend.yml"
  fi
elif [[ -f "${COMPOSE_DIR}/base.yml" && -f "${COMPOSE_DIR}/prod.yml" ]]; then
  COMPOSE_FILES=( -f "${COMPOSE_DIR}/base.yml" -f "${COMPOSE_DIR}/prod.yml" )
  echo "Using compose dir files: ${COMPOSE_DIR}/base.yml + ${COMPOSE_DIR}/prod.yml"
  if [[ -f "${COMPOSE_DIR}/prod.extend.yml" ]]; then
    COMPOSE_FILES+=( -f "${COMPOSE_DIR}/prod.extend.yml" )
    echo "Also: ${COMPOSE_DIR}/prod.extend.yml"
  fi
else
  # Legacy compose file convention
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

# ------------------------------------------------------------------------------
# Backend: load docker image from tar.gz (if present)
# ------------------------------------------------------------------------------
if [[ "${DEPLOY_BACKEND}" == "true" ]]; then
  if download_if_exists "${BACKEND_TAR}" "${WORK_DIR}/${BACKEND_TAR}"; then
    echo "Preparing backend image from ${BACKEND_TAR}"
    IMAGE_TAR="${WORK_DIR}/backend.tar"

    gunzip -c "${WORK_DIR}/${BACKEND_TAR}" > "${IMAGE_TAR}"
    [[ -f "${IMAGE_TAR}" ]] || {
      echo "Decompression failed: ${IMAGE_TAR} missing" >&2
      exit 1
    }

    echo "Loading backend image from ${IMAGE_TAR}"
    sudo docker load -i "${IMAGE_TAR}"

    rm -f "${IMAGE_TAR}" "${WORK_DIR}/${BACKEND_TAR}"
  else
    echo "No backend artifact (${BACKEND_TAR}) found; skipping backend load"
  fi

  if download_if_exists "${WORKERS_TAR}" "${WORK_DIR}/${WORKERS_TAR}"; then
    echo "Loading worker images from ${WORKERS_TAR}"
    WORKERS_IMAGE_TAR="${WORK_DIR}/workers.tar"
    gunzip -c "${WORK_DIR}/${WORKERS_TAR}" > "${WORKERS_IMAGE_TAR}"
    sudo docker load -i "${WORKERS_IMAGE_TAR}"
    rm -f "${WORKERS_IMAGE_TAR}" "${WORK_DIR}/${WORKERS_TAR}"
  else
    echo "No worker images artifact (${WORKERS_TAR}) found; skipping"
  fi
fi

# ------------------------------------------------------------------------------
# Frontend: extract tarball into frontend dir (if present)
# ------------------------------------------------------------------------------
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

# ------------------------------------------------------------------------------
# Compose up (backend deploy only)
# ------------------------------------------------------------------------------
# Frontend-only runs should not call compose: this deploy path does not load
# backend.tar.gz, so pinning api to ${APP_NAME}-api:${SHA} would make Docker try to
# pull from a registry. Also, full-stack CI runs backend + frontend jobs in parallel;
# frontend must not race the backend worker that loads images on EC2.
#
# Caddy / reverse-proxy reload is handled separately (e.g. deploy-shared-caddyfile.sh in CI),
# not by this compose project.
if [[ "${DEPLOY_BACKEND}" == "true" ]]; then
  ENV_ARGS=()
  if [[ -f "${ENV_FILE}" ]]; then
    ENV_ARGS+=( --env-file "${ENV_FILE}" )
  fi

  echo "docker compose up"
  echo "  project=${COMPOSE_PROJECT_NAME}"
  echo "  files=${COMPOSE_FILES[*]}"
  if [[ ${#ENV_ARGS[@]} -gt 0 ]]; then
    echo "  env_args=${ENV_ARGS[*]}"
  fi

  if docker compose version >/dev/null 2>&1; then
    sudo -E docker compose -p "${COMPOSE_PROJECT_NAME}" "${COMPOSE_FILES[@]}" "${ENV_ARGS[@]}" up -d --force-recreate
  else
    sudo -E docker-compose -p "${COMPOSE_PROJECT_NAME}" "${COMPOSE_FILES[@]}" "${ENV_ARGS[@]}" up -d --force-recreate
  fi
else
  echo "Skipping docker compose (DEPLOY_BACKEND=false): static/artifact deploy only; no container recreate."
fi

echo "Remote deploy complete"
