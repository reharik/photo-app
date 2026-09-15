#!/bin/sh
set -e
# Use NODE_ENV from environment, default to production if not set
export NODE_ENV=${NODE_ENV:-development}
cd /app/apps/media-worker/dist
# `exec` is load-bearing: without it this shell stays PID 1 and node is a
# child. Docker signals PID 1 only, and a non-interactive sh does not forward
# SIGTERM to its children, so the app's shutdown handlers never ran in prod.
exec node index.js
