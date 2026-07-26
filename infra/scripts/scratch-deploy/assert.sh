#!/usr/bin/env bash
# Assertions against the scratch stack.
#   ./assert.sh tables            — scratch_* tables + applied migrations
#   ./assert.sh api-container-id  — api container id (proves recreate / no-recreate)
set -euo pipefail

PROJECT="${COMPOSE_PROJECT_NAME:-homeroll-scratch}"

psql_scratch() {
  docker exec "$(docker ps -q --filter "label=com.docker.compose.project=${PROJECT}" \
    --filter "label=com.docker.compose.service=db" | head -n 1)" \
    psql -U scratch -d scratch -tAc "$1"
}

case "${1:?usage: assert.sh tables|api-container-id}" in
  tables)
    echo "scratch_probe present : $(psql_scratch "SELECT to_regclass('public.scratch_probe') IS NOT NULL;")"
    echo "scratch_broken present: $(psql_scratch "SELECT to_regclass('public.scratch_broken') IS NOT NULL;")"
    echo "applied migrations:"
    psql_scratch "SELECT name FROM knex_migrations ORDER BY id;" | sed 's/^/  /'
    ;;
  api-container-id)
    docker ps -q --filter "label=com.docker.compose.project=${PROJECT}" \
      --filter "label=com.docker.compose.service=api" | head -n 1
    ;;
esac
