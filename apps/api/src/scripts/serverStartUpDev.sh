#!/bin/sh
set -e
# Use NODE_ENV from environment, default to development if not set
export NODE_ENV=${NODE_ENV:-development}
cd /app/apps/api

# Migrations run in the `migrate` one-shot service (see
# infra/config/docker-compose/base.yml); this container gates on it via
# depends_on: service_completed_successfully.
#
# Seeding is dev fixture data only — prod NEVER seeds. The tolerant `|| echo`
# is gone: this now runs only after the migrate one-shot has exited 0, so the
# "database not ready yet" case it papered over can no longer happen.
echo "Running database seeds..."
npx tsx src/scripts/runSeeds.ts

# Start the server with nodemon
echo "Starting server with nodemon..."
npx nodemon --verbose
