#!/usr/bin/env bash
# measure-restart.sh — times API + media-worker restart from container logs
set -uo pipefail

API=photo-app-dev-api-1
WORKER=photo-app-dev-media-worker-1
RUNS=${1:-5}   # number of samples; default 5, override: ./measure-restart.sh 10

# epoch millis from an RFC3339 timestamp like 2026-05-19T01:23:10.344300000Z
to_ms() { date -u -d "$1" +%s%3N 2>/dev/null || gdate -u -d "$1" +%s%3N; }

measure_one() {
  local since
  since=$(date -u +%s)

  docker exec "$API"    sh -c "touch ./apps/api/src/index.ts"
  docker exec "$WORKER" sh -c "touch ./apps/media-worker/src/index.ts"

  sleep 4
  local logs
  logs=$( { docker logs -t --since "$since" "$API"; docker logs -t --since "$since" "$WORKER"; } 2>/dev/null )
  
  # api: gap from "[nodemon] starting" to "Server running"
  local api_start api_ready
  api_start=$(echo "$logs" | grep -m1 "nodemon] starting"  | awk '{print $1}')
  api_ready=$(echo "$logs" | grep -m1 "Server running"     | awk '{print $1}')

  # worker: gap from "[nodemon] starting" to "Media worker started"
  local wk_start wk_ready
  wk_start=$(echo "$logs" | grep "nodemon] starting"       | sed -n '2p' | awk '{print $1}')
  wk_ready=$(echo "$logs" | grep -m1 "Media worker started"| awk '{print $1}')

  if [[ -z "$api_start" || -z "$api_ready" ]]; then
    echo "  (could not find api markers — raise the sleep, or check log lines)"
    return
  fi

  local api_ms
  api_ms=$(( $(to_ms "$api_ready") - $(to_ms "$api_start") ))
  echo "  api:    ${api_ms} ms"

  if [[ -n "$wk_start" && -n "$wk_ready" ]]; then
    local wk_ms
    wk_ms=$(( $(to_ms "$wk_ready") - $(to_ms "$wk_start") ))
    echo "  worker: ${wk_ms} ms"
  fi
}

echo "Measuring $RUNS restart(s)..."
for i in $(seq 1 "$RUNS"); do
  echo "Run $i:"
  measure_one
  sleep 2
done