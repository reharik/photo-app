# Deploy (EC2 + SSM + S3 + Caddy)

Generic deploy flow used by app repos that use cannibal-infra. App-specific details (APP_NAME, S3 bucket, paths, domains) are configured per repo.

## Overview

1. **CI** runs on push/PR (lint, test, build).
2. **CD** triggers on push to main (or manual dispatch):
   - **Backend**: Build Docker image → upload to S3 → run SSM command on EC2 to download and run deploy script → run migrations → verify health.
   - **Frontend**: Build static assets → upload to S3 → run SSM to download to EC2 → update Caddy (or shared proxy) and reload.
3. **Shared proxy** (optional): One Caddy container can serve multiple apps on the same EC2 (different domains/paths). Scripts in `scripts/remote/` support this (e.g. `setup-shared-proxy.sh`, `deploy-shared-caddyfile.sh`).

## Key scripts (under `infra/scripts/` when consumed)

- **deploy/deploy-ec2.sh** – Entrypoint on EC2: load image, docker compose up, migrations, optional shared-proxy reload.
- **deploy/ssm-run.sh** – From GitHub Actions: upload script to S3, send SSM command to EC2, poll and stream output.
- **remote/download-backend.sh** – On EC2: pull backend image and compose file from S3.
- **remote/deploy-backend.sh** – On EC2: run deploy-ec2.sh.
- **remote/verify-backend.sh** – On EC2: health check (e.g. curl localhost:3000/health).
- **remote/deploy-frontend.sh** – On EC2: pull frontend tarball and Caddyfile from S3, extract, reload proxy.
- **remote/deploy-shared-caddyfile.sh** – On EC2: pull shared Caddyfile from S3, reload shared-proxy.
- **remote/setup-shared-proxy.sh** – On EC2: ensure shared Caddy container is running with correct mounts.
- **remote/cleanup-docker.sh** – Optional: prune images/containers/volumes on EC2.

## App config (infra.app.config.json)

Infra provides **defaults** in `infra/config/infra.app.config.defaults.json`. The consumer repo keeps a single app config at **repo root**: `infra.app.config.json`. Workflows and scripts never read the consumer file directly; they use the **loader**, which merges defaults and consumer (consumer overrides):

```bash
./infra/scripts/deploy/load-infra-app-config.sh >> "$GITHUB_ENV"   # in Actions
eval "$(./infra/scripts/deploy/load-infra-app-config.sh)"         # local export
```

- **Defaults**: `infra/config/infra.app.config.defaults.json` (infra-owned; defines every key with a safe default).
- **Consumer**: repo root `infra.app.config.json` (app-owned; copy from `infra/templates/app/infra.app.config.example.json` and set `appName`, `s3Bucket`, etc.).
- **Merge**: `load-infra-app-config.sh` runs `jq -s '.[0] * .[1]' defaults.json consumer.json` and outputs `KEY=VALUE` lines. If the consumer file is missing, defaults alone are used (deploy will fail later if e.g. `s3Bucket` is empty).

Schema (all optional in consumer; defaults apply): `appName`, `env`, `awsRegion`, `s3Bucket`, `ssm.*`, `ssmPoll.*`, `docker.*`, and `requiredSecrets` (metadata only: lists secret **names** the app must configure—no values). Under `docker`, set `appWorkspacePath` (e.g. `apps/api`) for the primary backend image; the Dockerfile derives npm `--workspace=@app/<leaf>` and `nx build <leaf>` from `basename(appWorkspacePath)`. Legacy key `apiWorkspacePath` is still accepted by the loader.

See `config/infra.app.config.defaults.json`: `requiredSecrets.backendDeploy` and `requiredSecrets.frontendBuild` are the lists to add in GitHub Settings → Secrets and to pass when using `workflow_call`.

## Required env / secrets (app-owned)

- **From config** (via loader): `APP_NAME`, `AWS_REGION`, `S3_BUCKET`, `SSM_TAG_HOST`, `SSM_TAG_ENV` (set from `infra.app.config.json` + defaults).
- **Secrets**: OIDC `AWS_ROLE_ARN`; for backend deploy, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (written to `env.env` and installed on EC2). When this workflow is invoked via `workflow_call`, the **caller** must pass these (e.g. `secrets: inherit` or explicit `POSTGRES_USER: ${{ secrets.POSTGRES_USER }}` etc.); frontend build e.g. `VITE_*` vars.
- **Override**: `SSM_TARGETS_OVERRIDE` if not using tag-based targeting.

## S3 layout (convention)

- `deployments/{APP_NAME}/` – backend image, compose file, deploy script, frontend tarball, app Caddyfile.
- `deployments/shared/Caddyfile` – shared multi-app Caddy config (if used).

## EC2 layout (convention)

- App root: e.g. `/opt/{app}/` (app-specific).
- Shared: `/opt/shared/Caddyfile` for shared Caddy.
- Scripts and env files are app-owned or deployed from S3 per run.

## Optional extra services (consumer app)

To run more than one container from the same repo:

1. **`ops/deploy/build-extra-images.sh`** (optional) — If this file exists, the backend deploy job runs it after the default API image build. The script should build any extra images and append **one `image:tag` per line** to `artifacts/extra-image-tags.txt`. Those references are included in the same `backend.tar.gz` as the API image pair.

2. **Compose overlay** — If **`ops/deploy/prod.compose.extend.yml`** or **`infra/config/docker-compose/prod.extend.yml`** exists, it is uploaded as `compose/prod.extend.yml`. On EC2, `remote-deploy.sh` adds `-f prod.extend.yml` after `base.yml` and `prod.yml` when that file is present.

Infra does not define app-specific services or image names; those stay in the consuming repository.

## Risks / TODOs

See `manifest.json` for parameterization TODOs (e.g. APP_NAME, path filters, Nx config sharing) and risks.
