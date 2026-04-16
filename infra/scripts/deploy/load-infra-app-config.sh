#!/usr/bin/env bash
set -euo pipefail

log() { echo "$@" >&2; }  # stderr logger

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT="$(cd "${INFRA_ROOT}/.." && pwd)"

DEFAULTS="${INFRA_ROOT}/config/infra.app.config.defaults.json"
CONSUMER_DEFAULT="${REPO_ROOT}/infra.app.config.json"
CONSUMER="${1:-$CONSUMER_DEFAULT}"

if [[ ! -f "$DEFAULTS" ]]; then
  echo "Defaults not found: $DEFAULTS" >&2
  exit 1
fi

log "cwd: $(pwd)"
log "defaults: $DEFAULTS"
log "consumer:  $CONSUMER"
log "defaults type: $(jq -r type "$DEFAULTS")"
[[ -f "$CONSUMER" ]] && log "consumer type: $(jq -r type "$CONSUMER")"

# Merge defaults first, then consumer overrides (recursive object merge; arrays replaced)
if [[ -f "$CONSUMER" ]]; then
  MERGED=$(jq -s '.[0] * .[1]' "$DEFAULTS" "$CONSUMER")
else
  log "consumer config not found; using defaults only"
  MERGED=$(jq . "$DEFAULTS")
fi

# Validate required keys exist after merge (fail fast; no silent fallbacks)
# docker.appWorkspacePath preferred; docker.apiWorkspacePath supported for older consumer configs
echo "$MERGED" | jq -e '
  .appName and .env and .awsRegion and
  .ssm.tagHost and .ssm.tagEnv and
  .ssmPoll.delaySeconds and .ssmPoll.maxAttempts and
  .docker.nodeVersion and (.docker.appWorkspacePath // .docker.apiWorkspacePath) and
  .docker.nodeEntrypoint
' >/dev/null

# Emit env vars (no defaults here; defaults live only in defaults.json)
echo "$MERGED" | jq -r '
  "APP_NAME=\(.appName)",
  "ENV_NAME=\(.env)",
  "AWS_REGION=\(.awsRegion)",
  "S3_BUCKET=\(.s3Bucket)",
  "SSM_TAG_HOST=\(.ssm.tagHost)",
  "SSM_TAG_ENV=\(.ssm.tagEnv)",
  "SSM_POLL_DELAY_SECONDS=\(.ssmPoll.delaySeconds)",
  "SSM_POLL_MAX_ATTEMPTS=\(.ssmPoll.maxAttempts)",
  "DOCKER_NODE_VERSION=\(.docker.nodeVersion)",
  "DOCKER_APP_WORKSPACE_PATH=\(.docker.appWorkspacePath // .docker.apiWorkspacePath)",
  "DOCKER_NODE_ENTRYPOINT=\(.docker.nodeEntrypoint)",
  "DOCKER_WORKERS_JSON=\(.docker.workers // [] | @json)",
  "DOCKER_EXTRA_BACKEND_PATHS=\(.docker.workers // [] | map(.workspacePath) | join(" "))"
'
