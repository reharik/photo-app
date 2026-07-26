#!/usr/bin/env bash
# Builds the api image the way .github/workflows/deploy.yml does
# (target runtime-node, SERVICE_NAME=api), minus the arm64 platform.
# This is the REAL prod image shape: compiled dist/, serverStartUpProd.sh
# entrypoint, migrations baked in at dist/db/migrations.
#
#   ./build-image.sh <sha-tag>
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="${REPO:-$(cd "${HERE}/../../.." && pwd)}"
APP_NAME="${APP_NAME:-homeroll}"
SHA="${1:?usage: build-image.sh <sha-tag>}"

echo "Building ${APP_NAME}-api:${SHA} (target runtime-node)"
docker build \
  -f "${REPO}/infra/docker/Dockerfile" \
  --target runtime-node \
  --build-arg SERVICE_NAME=api \
  -t "${APP_NAME}-api:${SHA}" \
  "${REPO}"

echo
echo "Verifying the image really is the prod shape:"
docker run --rm --entrypoint sh "${APP_NAME}-api:${SHA}" -c '
  echo "  migrate entrypoint:"; ls apps/api/dist/scripts/
  echo "  migrations baked in: $(ls apps/api/dist/db/migrations | wc -l)"
  echo "  seed runner absent:  $(ls apps/api/dist/scripts/runSeeds.js 2>/dev/null || echo yes)"
  echo "  seed data absent:    $(ls -d apps/api/dist/db/seeds apps/api/dist/db/seedUsers.js 2>/dev/null || echo yes)"
'
