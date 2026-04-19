#!/usr/bin/env bash
set -euo pipefail

RUNTIME_USER_NAME="photoshare-backend-dev"
RUNTIME_POLICY_NAME="photoshare-s3-media-access-dev"

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Applying runtime policy to runtime user: $RUNTIME_USER_NAME"
aws iam put-user-policy \
  --user-name "$RUNTIME_USER_NAME" \
  --policy-name "$RUNTIME_POLICY_NAME" \
  --policy-document "file://$BASE_DIR/local-runtime-policy.json"


echo "Done."
