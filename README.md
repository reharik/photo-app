# cannibal-infra (extract staging)

This directory is a **staging extract** of shared infrastructure, tooling, and config from the network app repo. It is intended to be moved into a separate repository called **cannibal-infra**, which consuming app repos will pull in via **git subtree** at path `/infra`.

## Purpose

- **Do not delete or move** the original files in the app repo yet; this is extraction/staging only.
- When cannibal-infra is created, app repos will add it as a subtree: `git subtree add --prefix=infra <cannibal-infra-repo-url> main`
- App-owned config (e.g. `infra.app.config.json`) and wiring will be added later; this extract only contains infra-owned assets.

## Layout (maps to `/infra` in app repos)

| Path in this extract     | Purpose |
|--------------------------|--------|
| `README.md`              | This file |
| `docs/subtree.md`        | How to add/update the subtree in app repos |
| `docs/deploy.md`         | Generic deploy flow (EC2, SSM, S3, Caddy) |
| `scripts/deploy/`        | Deploy entrypoints and helpers (e.g. deploy-ec2.sh, ssm-run.sh) |
| `scripts/ci/`            | CI helper scripts (if any) |
| `scripts/local/`         | Local/dev scripts (e.g. verify-dns-and-frontend) |
| `github/workflows/`      | Reusable or template GitHub Actions workflows |
| `config/tsconfig/`       | Base tsconfig for TypeScript |
| `config/eslint/`         | Shared ESLint base config |
| `config/prettier/`       | Prettier config and ignore |
| `config/jest/`           | Shared Jest preset (Nx); app projects extend it |
| `config/nx/`             | Optional Nx base config (see manifest) |
| `templates/app/`         | App-agnostic templates (e.g. shared Caddyfile, Dockerfile, docker-compose, .dockerignore) |
| `manifest.json`          | Inventory: what was copied, what stayed in app, TODOs, risks |

## Usage after subtree

- App CI/deploy workflows will reference `/infra/scripts/...`, `/infra/github/workflows/...`, etc.
- Shared configs (ESLint, Prettier, tsconfig base) will be extended from `/infra/config/...`.
- See `manifest.json` for parameterization TODOs (e.g. APP_NAME, S3 keys, path filters).
