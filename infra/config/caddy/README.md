# Shared Caddyfile (infra)

**Single source of truth:** `Caddyfile.shared` lists all known apps on the shared proxy (network, chore-tracker, etc.). Deploy uploads this file from infra to S3 `deployments/shared/Caddyfile`; the EC2 shared-proxy uses it.

**To add a new app:** Add a server block to `Caddyfile.shared` in infra (domain, reverse_proxy port, root path for static files). No file at app repo root is required for the shared proxy.
