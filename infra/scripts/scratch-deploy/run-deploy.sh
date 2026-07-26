#!/usr/bin/env bash
# Invokes the REAL infra/scripts/remote/remote-deploy.sh against the scratch
# stack. That script is not modified — only environment and PATH differ.
#
#   ./run-deploy.sh <sha-tag> [changed-service-names]
#
# Prints the script's exit code as the last line; that code IS the assertion
# for case 2.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="${REPO:-$(cd "${HERE}/../../.." && pwd)}"
# Deliberately NOT named WORK_DIR: remote-deploy.sh has its own WORK_DIR and
# would inherit ours if the name collided. Not exported, either.
SCRATCH_DIR="${SCRATCH_DIR:-/tmp/homeroll-scratch-deploy}"

SHA="${1:?usage: run-deploy.sh <sha-tag> [changed-service-names]}"
CHANGED="${2:-api}"

if [[ ! -x "${SCRATCH_DIR}/bin/sudo" ]]; then
  echo "Missing shims in ${SCRATCH_DIR}/bin — run ./prep.sh first." >&2
  exit 2
fi

if ! docker info >/dev/null 2>&1; then
  echo "WARNING: docker is not usable without root for this user." >&2
  echo "  The sudo shim runs docker directly, so it will fail. Add yourself to" >&2
  echo "  the 'docker' group, or run this whole harness as root." >&2
fi

export PATH="${SCRATCH_DIR}/bin:${PATH}"      # aws + sudo shims first
export APP_NAME=homeroll
export ENV=scratch
export SHA
export AWS_REGION=us-east-1
export S3_BUCKET=scratch-not-used
export APP_ROOT="${SCRATCH_DIR}/opt/homeroll"
export COMPOSE_PROJECT_NAME=homeroll-scratch
export DEPLOY_BACKEND=true
export DEPLOY_FRONTEND=false
export CHANGED_SERVICE_NAMES="${CHANGED}"

echo "=============================================================="
echo "remote-deploy.sh  SHA=${SHA}  CHANGED_SERVICE_NAMES=${CHANGED}"
echo "=============================================================="

bash "${REPO}/infra/scripts/remote/remote-deploy.sh"
rc=$?

echo "--------------------------------------------------------------"
echo "remote-deploy.sh EXIT CODE = ${rc}"
exit "$rc"
