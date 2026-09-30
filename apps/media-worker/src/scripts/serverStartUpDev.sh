#!/bin/sh
set -e
# Use NODE_ENV from environment, default to development if not set
export NODE_ENV=${NODE_ENV:-development}
cd /app/apps/media-worker


# Start the server with nodemon
echo "Starting server with nodemon..."
exec /app/node_modules/.bin/nodemon
