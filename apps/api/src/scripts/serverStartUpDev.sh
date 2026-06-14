#!/bin/sh
set -e
# Use NODE_ENV from environment, default to development if not set
export NODE_ENV=${NODE_ENV:-development}
cd /app/apps/api

# Run migrations using tsx (TypeScript executor for dev mode)
echo "Running database migrations..."
npx tsx src/scripts/runMigrations.ts || echo "Warning: Migrations failed, continuing..."

# Run seeds using tsx
echo "Running database seeds..."
npx tsx src/scripts/runSeeds.ts || echo "Warning: Seeds failed, continuing..."

# Start the server with nodemon
echo "Starting server with nodemon..."
npx nodemon --verbose
