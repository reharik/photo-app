#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  deploy.sh --app <name> --env <env> --sha <sha> [--bucket <s3-bucket>] [--region <aws-region>]
           [--deploy-backend true|false] [--deploy-frontend true|false]

Requires:
  - aws cli configured (OIDC in GH Actions is fine)
  - infra/scripts/deploy/ssm-run.sh exists and defines ssm_run(comment, local_script_path)
  - SSM target selection via env (tags) or explicit instance id handled by ssm-run.sh
EOF
}

APP_NAME=""
ENV=""
SHA=""
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET="${S3_BUCKET:-}"
DEPLOY_BACKEND="true"
DEPLOY_FRONTEND="true"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app) APP_NAME="$2"; shift 2;;
    --env) ENV="$2"; shift 2;;
    --sha) SHA="$2"; shift 2;;
    --bucket) S3_BUCKET="$2"; shift 2;;
    --region) AWS_REGION="$2"; shift 2;;
    --deploy-backend) DEPLOY_BACKEND="$2"; shift 2;;
    --deploy-frontend) DEPLOY_FRONTEND="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 2;;
  esac
done

[[ -n "$APP_NAME" && -n "$ENV" && -n "$SHA" ]] || { usage; exit 2; }
[[ -n "$S3_BUCKET" ]] || { echo "Missing S3_BUCKET (pass --bucket or set env)"; exit 2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load conventions
# common.sh expects APP_NAME/ENV/SHA to be set
# shellcheck disable=SC1090
source "${SCRIPT_DIR}/common.sh"

# Safety: ensure artifact names have sane defaults even if common.sh is minimal
BACKEND_TAR="${BACKEND_TAR:-backend.tar.gz}"
FRONTEND_TAR="${FRONTEND_TAR:-frontend.tar.gz}"
REMOTE_COMPOSE_NAME="${REMOTE_COMPOSE_NAME:-docker-compose.yml}"
REMOTE_ENV_NAME="${REMOTE_ENV_NAME:-env.env}"

S3_PREFIX="${S3_PREFIX:-deployments/${APP_NAME}/${SHA}}"
S3_URI="s3://${S3_BUCKET}/${S3_PREFIX}"

echo "Deploy: app=${APP_NAME} env=${ENV} sha=${SHA}"
echo "S3: ${S3_URI}"

ARTIFACT_DIR="${ARTIFACT_DIR:-./artifacts}"

upload_if_exists() {
  local local_path="$1"
  local remote_name="$2"

  if [[ -f "$local_path" ]]; then
    echo "Uploading $local_path -> ${S3_URI}/${remote_name}"
    aws s3 cp "$local_path" "${S3_URI}/${remote_name}" --region "$AWS_REGION"
    return 0
  fi
  return 1
}

upload_dir_if_exists() {
  local local_dir="$1"
  local remote_prefix="$2"  # e.g. "compose"

  if [[ -d "$local_dir" ]]; then
    echo "Uploading directory $local_dir -> ${S3_URI}/${remote_prefix}/"
    aws s3 cp "$local_dir" "${S3_URI}/${remote_prefix}/" --recursive --region "$AWS_REGION"
    return 0
  fi
  return 1
}

if [[ "${DEPLOY_BACKEND}" == "true" ]]; then
  upload_if_exists "${ARTIFACT_DIR}/${BACKEND_TAR}" "${BACKEND_TAR}" \
    || echo "No backend artifact found at ${ARTIFACT_DIR}/${BACKEND_TAR} (skipping upload)"
  upload_if_exists "${ARTIFACT_DIR}/${WORKERS_TAR}" "${WORKERS_TAR}" || true
fi

if [[ "${DEPLOY_FRONTEND}" == "true" ]]; then
  upload_if_exists "${ARTIFACT_DIR}/${FRONTEND_TAR}" "${FRONTEND_TAR}" \
    || echo "No frontend artifact found at ${ARTIFACT_DIR}/${FRONTEND_TAR} (skipping upload)"
fi

# Optional: upload merged compose and env (generated in CI)
upload_if_exists "${ARTIFACT_DIR}/${REMOTE_COMPOSE_NAME}" "${REMOTE_COMPOSE_NAME}" || true
upload_if_exists "${ARTIFACT_DIR}/${REMOTE_ENV_NAME}" "${REMOTE_ENV_NAME}" || true

# Option A: upload compose directory (base.yml + prod.yml)
upload_dir_if_exists "${ARTIFACT_DIR}/compose" "compose" || true

# Prepare SSM invocation
REMOTE_SCRIPT_LOCAL="${SCRIPT_DIR}/../remote/remote-deploy.sh"
if [[ ! -f "${REMOTE_SCRIPT_LOCAL}" ]]; then
  echo "Remote deploy script not found: ${REMOTE_SCRIPT_LOCAL}" >&2
  exit 2
fi

# Pin API image to this SHA only when we deploy backend artifacts. Frontend-only deploy does not
# load backend.tar.gz, so ${APP_NAME}-api:${SHA} is not present locally; Docker would try to pull
# from a registry and fail.
if [[ "${DEPLOY_BACKEND}" == "true" ]]; then
  export API_IMAGE="${APP_NAME}-api:${SHA}"
fi

# Export vars so ssm-run.sh writes them into remote.env on S3 (API_IMAGE only when set above).
export APP_NAME ENV SHA AWS_REGION S3_BUCKET DEPLOY_BACKEND DEPLOY_FRONTEND S3_PREFIX

# Source ssm-run.sh to get ssm_run()
# shellcheck disable=SC1090
source "${SCRIPT_DIR}/ssm-run.sh"

if ! declare -F ssm_run >/dev/null 2>&1; then
  echo "ssm_run() not found after sourcing ssm-run.sh" >&2
  exit 2
fi

ssm_run "deploy ${APP_NAME} ${ENV} ${SHA}" "${REMOTE_SCRIPT_LOCAL}"