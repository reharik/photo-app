#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION required}"
: "${S3_BUCKET:?S3_BUCKET required}"

SHARED_CADDY_S3_URI="s3://${S3_BUCKET}/deployments/shared/Caddyfile"
TARGET_CADDYFILE="/opt/shared/Caddyfile"

file_changed=0

tmp="$(mktemp /tmp/shared-caddy.XXXXXX)"
trap 'rm -f -- "$tmp"' EXIT

aws s3 cp "${SHARED_CADDY_S3_URI}" "$tmp" --region "${AWS_REGION}"

if [[ -z "${tmp}" || ! -f "$tmp" ]]; then
  echo "error: candidate Caddyfile missing (tmp is empty or not a file)" >&2
  exit 1
fi

if [[ ! -s "$tmp" ]]; then
  echo "error: candidate Caddyfile is empty" >&2
  exit 1
fi

if [[ -f "$TARGET_CADDYFILE" ]]; then
  old_hash="$(sha256sum "$TARGET_CADDYFILE" | awk '{print $1}')"
else
  old_hash=""
fi
new_hash="$(sha256sum "$tmp" | awk '{print $1}')"

if [[ -z "$old_hash" || "$old_hash" != "$new_hash" ]]; then
  sudo install -m 0644 "$tmp" "$TARGET_CADDYFILE"
  file_changed=1
else
  echo "Caddyfile unchanged; will not recreate shared-proxy."
fi

if [[ "$file_changed" -eq 1 ]] && docker ps -a --format '{{.Names}}' | grep -q '^shared-proxy$'; then
  echo "Caddyfile changed; recreating shared-proxy container"
  docker stop shared-proxy
  docker rm shared-proxy
fi

# ALWAYS ensure container exists/running
if docker ps -a --format '{{.Names}}' | grep -q '^shared-proxy$'; then
  docker ps --format '{{.Names}}' | grep -q '^shared-proxy$' || docker start shared-proxy
else
  docker run -d \
    --name shared-proxy \
    --restart unless-stopped \
    --network host \
    -v /opt/shared/Caddyfile:/etc/caddy/Caddyfile:ro \
    -v /opt/network/frontend:/srv/network:ro \
    -v /opt/chore-tracker/frontend:/srv/chore-tracker:ro \
    -v /opt/photo-app/frontend:/srv/photo-app:ro \
    -v caddy_data_shared:/data \
    -v caddy_config_shared:/config \
    caddy:2-alpine
fi
