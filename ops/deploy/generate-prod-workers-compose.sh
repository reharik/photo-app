#!/usr/bin/env bash
set -euo pipefail

CONFIG_PATH="${1:?config path required}"
SHA="${2:?sha required}"

APP_NAME="$(jq -r '.appName' "$CONFIG_PATH")"

cat <<EOF
services:
EOF

jq -c '.docker.workers[]?' "$CONFIG_PATH" | while IFS= read -r worker; do
  NAME="$(jq -r '.name' <<<"$worker")"

  cat <<EOF
  ${NAME}:
    platform: linux/arm64
    restart: unless-stopped
    image: ${APP_NAME}-${NAME}:${SHA}
    env_file:
      - /opt/${APP_NAME}/env/prod.env
    environment:
      NODE_ENV: production
      POSTGRES_PORT: "\${POSTGRES_PORT:-5432}"
    depends_on:
      db:
        condition: service_healthy
EOF
done