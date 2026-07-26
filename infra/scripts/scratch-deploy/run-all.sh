#!/usr/bin/env bash
# Runs the whole scratch-deploy suite end to end and asserts every case.
#
#   ./run-all.sh            run cases 3, 3b, 2; leave images for faster reruns
#   ./run-all.sh --clean    also remove images and the scratch tree afterwards
#
# Exit 0 only if every case passes. Safe to re-run: the stack is torn down and
# rebuilt from scratch each time, and the fixture migrations are removed from
# apps/api/db/migrations on ANY exit path, including failure and Ctrl-C.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="${REPO:-$(cd "${HERE}/../../.." && pwd)}"
SCRATCH_DIR="${SCRATCH_DIR:-/tmp/homeroll-scratch-deploy}"
PROJECT="${COMPOSE_PROJECT_NAME:-homeroll-scratch}"
APP_ROOT="${SCRATCH_DIR}/opt/homeroll"
MIGRATIONS_DIR="${REPO}/apps/api/db/migrations"
LOG_DIR="${SCRATCH_DIR}/logs"

CLEAN=false
[[ "${1:-}" == "--clean" ]] && CLEAN=true

# Image tags. ABSENT_TAG is never built — case 3b depends on it not existing.
BASE_TAG=scratch-base
PROBE_TAG=scratch-probe
ABSENT_TAG=scratch-absent
BROKEN_TAG=scratch-broken

PASSED=0
FAILED=0
declare -a RESULTS=()

ok()  { echo "    PASS  $1"; PASSED=$((PASSED + 1)); }
bad() { echo "    FAIL  $1"; FAILED=$((FAILED + 1)); }

expect() { # expect <label> <actual> <expected>
  if [[ "$2" == "$3" ]]; then ok "$1"; else bad "$1 — got '$2', expected '$3'"; fi
}

expect_log() { # expect_log <label> <logfile> present|absent <pattern>
  local label="$1" log="$2" mode="$3" pat="$4"
  if grep -q -- "$pat" "$log"; then
    [[ "$mode" == present ]] && ok "$label" || bad "$label — '$pat' should NOT appear"
  else
    [[ "$mode" == absent ]] && ok "$label" || bad "$label — '$pat' not found"
  fi
}

# --- always remove the fixture copies, whatever happens ----------------------
cleanup_fixtures() {
  rm -f "${MIGRATIONS_DIR}/0023_scratch_probe.ts" \
        "${MIGRATIONS_DIR}/0024_scratch_broken.ts"
}
trap cleanup_fixtures EXIT INT TERM

compose() { docker compose -p "${PROJECT}" \
  -f "${APP_ROOT}/compose/base.yml" \
  -f "${APP_ROOT}/compose/scratch.yml" \
  --env-file "${APP_ROOT}/env/scratch.env" "$@"; }

deploy() { # deploy <tag> <changed-services> <logfile> -> echoes exit code
  local tag="$1" svc="$2" log="$3" rc=0
  set +e
  bash "${HERE}/run-deploy.sh" "$tag" "$svc" >"$log" 2>&1
  rc=$?
  set -e
  echo "$rc"
}

tables() { bash "${HERE}/assert.sh" tables 2>/dev/null; }
probe_state() { tables | sed -n 's/^scratch_probe present *: *//p'; }
broken_state() { tables | sed -n 's/^scratch_broken present *: *//p'; }
api_id() { bash "${HERE}/assert.sh" api-container-id 2>/dev/null; }

# ============================ preflight ======================================
echo "=== preflight ==="

if [[ ! -x /usr/local/bin/betaname-backup.sh ]]; then
  echo "Missing /usr/local/bin/betaname-backup.sh — remote-deploy.sh hardcodes it." >&2
  echo "  sudo install -m 0755 ${HERE}/betaname-backup.sh /usr/local/bin/betaname-backup.sh" >&2
  exit 2
fi

if ! docker info >/dev/null 2>&1; then
  echo "docker is not usable without root for this user; the sudo shim cannot work." >&2
  exit 2
fi

bash "${HERE}/prep.sh" >/dev/null
mkdir -p "${LOG_DIR}"
echo "  scratch tree staged at ${APP_ROOT}"

echo "  tearing down any previous scratch stack"
compose down -v --remove-orphans >/dev/null 2>&1 || true

echo "  ensuring ${ABSENT_TAG} does not exist (case 3b depends on it)"
docker image rm -f "homeroll-api:${ABSENT_TAG}" >/dev/null 2>&1 || true

cleanup_fixtures   # in case a previous run died mid-flight

# ============================ case 3 =========================================
echo
echo "=== case 3 — migration in a SECOND deploy applies despite --no-deps ==="

echo "  [1/2] baseline deploy (no probe migration)"
bash "${HERE}/build-image.sh" "${BASE_TAG}" >"${LOG_DIR}/build-base.log" 2>&1
rc=$(deploy "${BASE_TAG}" api "${LOG_DIR}/case3-baseline.log")
expect "baseline deploy exits 0" "$rc" "0"
expect "scratch_probe absent before probe ships" "$(probe_state)" "f"

echo "  [2/2] second deploy carrying 0023_scratch_probe"
cp "${HERE}/fixtures/0023_scratch_probe.ts" "${MIGRATIONS_DIR}/"
bash "${HERE}/build-image.sh" "${PROBE_TAG}" >"${LOG_DIR}/build-probe.log" 2>&1
LOG="${LOG_DIR}/case3-probe.log"
rc=$(deploy "${PROBE_TAG}" api "${LOG}")
expect "second deploy exits 0" "$rc" "0"
expect "scratch_probe APPLIED despite --no-deps" "$(probe_state)" "t"
if tables | grep -q '0023_scratch_probe.js'; then
  ok "0023 recorded in knex_migrations"
else
  bad "0023 missing from knex_migrations"
fi
expect_log "migrate ran before recreate" "${LOG}" present "Running migrations"
expect_log "recreate used --no-deps" "${LOG}" present "Recreating compose services"
RESULTS+=("case 3")

# ============================ case 3b ========================================
echo
echo "=== case 3b — worker-only deploy uses the API_IMAGE fallback ==="

LOG="${LOG_DIR}/case3b.log"
rc=$(deploy "${ABSENT_TAG}" media-worker "${LOG}")
expect "worker-only deploy exits 0" "$rc" "0"
expect_log "API_IMAGE fell back to running api" "${LOG}" present "reused from running api"
expect_log "no registry pull for the absent tag" "${LOG}" absent "invalid reference format"
expect_log "migrate still ran" "${LOG}" present "Running migrations"
expect_log "only the worker was recreated" "${LOG}" present "Recreating compose services: media-worker"
RESULTS+=("case 3b")

# ============================ case 2 =========================================
echo
echo "=== case 2 — failed migration aborts the deploy ==="

API_BEFORE="$(api_id)"
cp "${HERE}/fixtures/0024_scratch_broken.ts" "${MIGRATIONS_DIR}/"
bash "${HERE}/build-image.sh" "${BROKEN_TAG}" >"${LOG_DIR}/build-broken.log" 2>&1
LOG="${LOG_DIR}/case2.log"
rc=$(deploy "${BROKEN_TAG}" api "${LOG}")
API_AFTER="$(api_id)"

if [[ "$rc" != "0" ]]; then ok "deploy exits non-zero (got $rc)"; else bad "deploy exited 0"; fi
expect_log "migration failed in postgres" "${LOG}" present "specified more than once"
expect_log "api was NEVER recreated" "${LOG}" absent "Recreating compose services"
expect "api container unchanged" "$API_AFTER" "$API_BEFORE"
expect "scratch_broken not created" "$(broken_state)" "f"
if tables | grep -q '0024_scratch_broken.js'; then
  bad "0024 wrongly recorded in knex_migrations"
else
  ok "0024 absent from knex_migrations"
fi
RESULTS+=("case 2")

# ============================ summary ========================================
cleanup_fixtures

echo
echo "=============================================================="
echo "ran: ${RESULTS[*]}"
echo "assertions passed: ${PASSED}   failed: ${FAILED}"
echo "logs: ${LOG_DIR}"
echo "=============================================================="

if [[ "${CLEAN}" == true ]]; then
  echo "cleaning up"
  compose down -v --remove-orphans >/dev/null 2>&1 || true
  docker image rm -f "homeroll-api:${BASE_TAG}" "homeroll-api:${PROBE_TAG}" \
    "homeroll-api:${BROKEN_TAG}" >/dev/null 2>&1 || true
  rm -rf "${SCRATCH_DIR}"
  echo "  stack, images and ${SCRATCH_DIR} removed"
  echo "  still yours to remove: sudo rm -f /usr/local/bin/betaname-backup.sh"
fi

if (( FAILED > 0 )); then
  echo "RESULT: FAILED"
  exit 1
fi
echo "RESULT: ALL PASS"
