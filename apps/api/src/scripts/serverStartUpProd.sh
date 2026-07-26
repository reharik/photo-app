#!/bin/sh
set -e
# Use NODE_ENV from environment, default to production if not set
export NODE_ENV=${NODE_ENV:-development}
cd /app/apps/api/dist
# Just serve. Migrations run in the `migrate` one-shot service (see
# infra/config/docker-compose/base.yml); this container gates on it via
# depends_on: service_completed_successfully.
#
# Prod NEVER seeds. runSeeds provisions fixture users with a shared known
# password; its only guard was "skip if any user exists", which fails open on a
# fresh, wiped, or restored database. Seeding stays in dev (boot) and CI
# (runner-side) only.
node index.js
