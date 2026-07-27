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

      # Reused PR image: the tarball was built on the PR and is tagged with the
      # PR HEAD sha, but everything downstream addresses images by the MERGE sha
      # -- workers.generated.yml hardcodes ${APP_NAME}-<svc>:${SHA}, and the
      # API_IMAGE pin below looks up ${APP_NAME}-api:${SHA}. Without this retag
      # the worker fails loudly (compose cannot pull a tag we never publish) but
      # the API fails SILENTLY: the pin misses, the fallback picks the currently
      # running container's image, and the deploy goes green having shipped the
      # OLD api. So retag rather than teach each consumer a second tag.
      #
      # Empty on a normal build, where the tarball is already tagged ${SHA}.
      if [[ -n "${IMAGE_SOURCE_TAG:-}" && "${IMAGE_SOURCE_TAG}" != "${SHA}" ]]; then
        echo "Retagging reused image: ${APP_NAME}-${service}:${IMAGE_SOURCE_TAG} -> :${SHA}"
        sudo docker tag \
          "${APP_NAME}-${service}:${IMAGE_SOURCE_TAG}" \
          "${APP_NAME}-${service}:${SHA}"
      fi

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

  # Pin the api image to this SHA only if this deploy actually loaded it.
  #
  # The build stage only produces images for CHANGED_SERVICE_NAMES, so a
  # worker-only deploy never ships an api tarball and `${APP_NAME}-api:${SHA}`
  # does not exist on this host. Compose would then try to pull it from a
  # registry we do not publish to, and the deploy would abort. This is the same
  # hazard deploy.sh guards for the frontend-only case; the migrate one-shot
  # made it reachable for backend deploys too, because every deploy now has to
  # resolve the api image whether or not api itself changed.
  #
  # The fallback is the image the RUNNING api container was created from. That
  # is safe for migrate specifically: migrations live in apps/api/db/migrations,
  # which detect-changed-deploy-targets classifies as `apps/api/*` -> service
  # `api`, so any deploy that ships a migration necessarily rebuilds api and
  # takes the pinned branch above. A deploy that does NOT rebuild api carries no
  # new migrations, so `migrate.latest()` from the running image is an
  # idempotent no-op — one that still repairs a database left unmigrated by an
  # earlier failed deploy.
  API_IMAGE_PINNED="${APP_NAME}-api:${SHA}"
  if sudo docker image inspect "${API_IMAGE_PINNED}" >/dev/null 2>&1; then
    export API_IMAGE="${API_IMAGE_PINNED}"
    echo "  API_IMAGE=${API_IMAGE} (built by this deploy)"
  else
    RUNNING_API_IMAGE="$(sudo docker ps \
      --filter "label=com.docker.compose.project=${COMPOSE_PROJECT_NAME}" \
      --filter "label=com.docker.compose.service=api" \
      --format '{{.Image}}' | head -n 1 || true)"
    if [[ -z "${RUNNING_API_IMAGE}" ]]; then
      echo "ERROR: cannot resolve an api image to run migrations from." >&2
      echo "  ${API_IMAGE_PINNED} was not loaded by this deploy" >&2
      echo "  (api is not in CHANGED_SERVICE_NAMES='${CHANGED_SERVICE_NAMES}')," >&2
      echo "  and no running api container exists in project ${COMPOSE_PROJECT_NAME}" >&2
      echo "  to fall back to. Re-run with FORCE_FULL_BACKEND=true to build and" >&2
      echo "  ship the api image." >&2
      exit 1
    fi
    export API_IMAGE="${RUNNING_API_IMAGE}"
    echo "  API_IMAGE=${API_IMAGE} (reused from running api; this deploy built no api image)"
  fi

  echo "docker compose up"
  echo "  project=${COMPOSE_PROJECT_NAME}"
  echo "  files=${COMPOSE_FILES[*]}"
  if [[ ${#ENV_ARGS[@]} > 0 ]]; then
    echo "  env_args=${ENV_ARGS[*]}"
  fi

  # Migrations run UNCONDITIONALLY, ahead of and independent of the recreate
  # loop below. Gating this on CHANGED_SERVICE_NAMES (as the recreate loop is)
  # would tie schema state to which services happened to change: a deploy whose
  # api image is unchanged would skip migrate entirely, so a database left
  # unmigrated by an earlier failed deploy would stay that way until the next
  # api change. Running it every time makes the step self-healing and, because
  # `migrate.latest()` is idempotent, free when there is nothing to apply.
  #
  # The recreate uses --no-deps deliberately, so db isn't bounced on every
  # deploy — but that also means compose does NOT evaluate depends_on, so the
  # `migrate` one-shot would never fire as a side effect. It must be invoked
  # explicitly. `set -e` aborts the deploy on a non-zero exit, which is what
  # makes a failed migration fail the deploy instead of crash-looping the api.
  #
  # No --no-deps here: `run` honours db's service_healthy condition and will
  # not recreate an already-running db.
  echo "Pre-migration safety dump"
  /usr/local/bin/betaname-backup.sh pre-migration

  echo "Running migrations (one-shot migrate service)"
  if docker compose version >/dev/null 2>&1; then
    sudo -E docker compose -p "${COMPOSE_PROJECT_NAME}" "${COMPOSE_FILES[@]}" "${ENV_ARGS[@]}" \
      run --rm migrate
  else
    # -T: compose v1 allocates a pseudo-TTY by default and fails with "the input
    # device is not a TTY" under SSM, whose stdin is not a terminal. v2 detects
    # this and needs no flag.
    sudo -E docker-compose -p "${COMPOSE_PROJECT_NAME}" "${COMPOSE_FILES[@]}" "${ENV_ARGS[@]}" \
      run --rm -T migrate
  fi

  RECREATE_SERVICES=()
  for service in ${CHANGED_SERVICE_NAMES}; do
    RECREATE_SERVICES+=("${service}")
  done

  if (( ${#RECREATE_SERVICES[@]} == 0 )); then
    echo "No changed backend services; skipping docker compose recreate"
  else
    echo "Recreating compose services: ${RECREATE_SERVICES[*]}"
    if docker compose version >/dev/null 2>&1; then
      sudo -E docker compose -p "${COMPOSE_PROJECT_NAME}" "${COMPOSE_FILES[@]}" "${ENV_ARGS[@]}" up -d \
        --force-recreate --no-deps "${RECREATE_SERVICES[@]}"
    else
      sudo -E docker-compose -p "${COMPOSE_PROJECT_NAME}" "${COMPOSE_FILES[@]}" "${ENV_ARGS[@]}" up -d \
        --force-recreate --no-deps "${RECREATE_SERVICES[@]}"
    fi
  fi
else
  echo "Skipping docker compose (DEPLOY_BACKEND=false): static/artifact deploy only; no container recreate."
fi

echo "Remote deploy complete"
