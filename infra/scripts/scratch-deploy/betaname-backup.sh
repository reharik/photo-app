#!/usr/bin/env bash
# STUB for scratch deploy testing ONLY. Stands in for the real
# /usr/local/bin/betaname-backup.sh, whose path is hardcoded at
# remote-deploy.sh:198 and therefore cannot be redirected via PATH.
#
# Install:   sudo install -m 0755 betaname-backup.sh /usr/local/bin/betaname-backup.sh
# Remove:    sudo rm -f /usr/local/bin/betaname-backup.sh
#
# Exits 0 so it never masks the migrate exit code we are actually testing.
set -euo pipefail
echo "[backup-stub] would dump database (label=${1:-none}) — no-op in scratch test"
exit 0
