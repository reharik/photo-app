# Photo App — Operations Reference

A grab-bag of "where does X live and how does it work" for the photo-app
production setup. Written for future-me at 11pm when something's broken.

## Architecture at a glance

- **Repo:** `photo-app` (this one). Contains the apps and the deploy
  workflows.
- **Shared infra:** `cannibal-infra`. Git subtree pulled into `infra/`.
  Has drifted from upstream — local changes have not been pushed back.
  Treat `infra/` as part of photo-app for now, not as a synced subtree.
- **Apps in the monorepo:**
  - `apps/api` — GraphQL API server
  - `apps/web` — Vite-built SPA frontend
  - `apps/media-worker` — background media processor
- **Runtime:** single EC2 instance running Docker Compose. Caddy reverse-proxies
  to the api and serves the frontend static files.

## CI/CD

### Workflows

- `.github/workflows/ci.yml` — runs on every push and PR. Lint, test, build.
- `.github/workflows/deploy.yml` — runs on push to `main` and on manual
  dispatch. Deploys backend images and frontend assets to EC2.

Both workflows are **self-contained** as of the May 2026 cleanup.
The old `uses: reharik/cannibal-infra/...` references were inlined.
There are still copies of these workflows at `infra/.github/workflows/`
because they came in via the subtree, but GitHub Actions ignores anything
outside the root `.github/workflows/`, so those files are inert. Delete
or leave; doesn't matter.

### Deploy flow

1. **Discover** job reads `infra.app.config.json`, runs
   `infra/scripts/deploy/detect-changed-deploy-targets.sh` to figure out
   which services need rebuilding based on the file paths changed since
   the last deploy.
2. **Build** job (matrix per changed service) builds a Docker image using
   `infra/docker/Dockerfile`, saves it as a `.tar.gz`, uploads to S3.
3. **Deploy backend** job uploads docker-compose files to S3, then uses
   AWS SSM to run `infra/scripts/remote/remote-deploy.sh` on the EC2
   instance, which pulls the new images and restarts containers.
4. **Deploy frontend** job builds the Vite SPA, uploads to S3, runs
   `infra/scripts/remote/remote-deploy.sh` via SSM to swap the static
   files behind Caddy.

### Config

- `infra.app.config.json` — top-level config for the deploy: `APP_NAME`
  (deployment identifier, e.g. `photo-app`), AWS region, S3 bucket, env name,
  worker definitions, Node version. Loaded by
  `infra/scripts/deploy/load-infra-app-config.sh`.
- AWS auth uses OIDC. The GHA workflow assumes the role in
  `secrets.AWS_ROLE_ARN`.

### Two different "APP_NAME" — don't confuse them

- **`APP_NAME` in `infra.app.config.json`** = `photo-app`. The deployment
  identifier. Used for S3 paths, image tag prefixes, container names.
- **`WORKSPACE_NAME` build arg** = `api` / `web` / `media-worker`. The
  Nx workspace folder name. Used inside the Dockerfile to know which app
  to build and which `apps/X/dist/scripts/...` to look up at runtime.

These were both called `APP_NAME` originally and collided. The Dockerfile
uses `WORKSPACE_NAME` to disambiguate.

## Codegen and the build graph

The build has several codegen steps that must run in a specific order.
If you ever see "X has no exported member Y" errors, codegen is the
first place to look.

### The chain

1. `api:schema-gen` — generates `apps/api/src/graphql/generated/schema.graphql`
   from the API's GraphQL resolvers.
2. `contracts:codegen` — reads that schema, generates smart enums into
   `packages/foundation/contracts/src/enums/graphqlSmartEnums.ts`. The
   generated file is **checked into git** so fresh clones and Docker
   builds don't need to run codegen before consumers can read from
   contracts' source.
3. `contracts:barrels` — depends on `codegen`. Re-runs barrelsby to
   re-index `src/enums/index.ts` so the new smart enums are exported.
4. Other packages' `gen:container` — generates IoC manifests in
   `apps/*/src/di/generated/` and `packages/**/src/generated/`. Not
   barrel-indexed; consumed via package.json `exports` subpaths.

### Where it's wired

Each package's `project.json` declares the order via `dependsOn`. The
key one is `packages/foundation/contracts/project.json`:

```json
"barrels": { "dependsOn": ["codegen"] }
"codegen": { "dependsOn": ["api:schema-gen"] }
"build":   { "dependsOn": ["clean", "barrels", "codegen", "^build"] }
```

If you add a new codegen target that writes into a barrel-indexed
directory, make sure `barrels` depends on the new codegen.

## Dockerfile

`infra/docker/Dockerfile` is multi-stage:

- `manifests` — extracts all `package.json` files + the lockfile via
  `find`. Cheap. Exists so the install layer below isn't invalidated by
  source-only changes.
- `builder` — copies manifests, runs `npm ci` with a BuildKit cache
  mount, then copies source and runs `nx build $WORKSPACE_NAME`.
- `deps-prod` — same manifests, `npm ci --omit=dev`. Provides the
  runtime `node_modules`.
- `runtime-node` — node:20-slim with `dist/` from `builder` and
  `node_modules` from `deps-prod`. Runs `serverStartUpProd.sh`.
- `runtime-web` — nginx:alpine serving the built Vite output.
- `dev` — for docker-compose local dev with mounted source.

The `# syntax=docker/dockerfile:1.6` line at the top is required for
cache mounts. Don't remove it.

## EC2 box — where things live

SSH to the EC2 instance for any of this.

### Application files

- `/opt/photo-app/` (or wherever `remote-deploy.sh` puts things) —
  current compose files, env files, downloaded artifacts.
- `/var/lib/docker/` — small (~1-2GB usually). Docker's own metadata.
- `/var/lib/containerd/` — where the actual image content lives. This
  is where disk usage piles up. ~13GB is "you need to clean up."

### Logs

- **Container stdout/stderr:** `docker logs <container-name>`. Live tail
  with `-f`. The underlying files are at
  `/var/lib/docker/containers/<container-id>/<container-id>-json.log`.
- **Caddy access logs:** wherever Caddyfile says (check
  `infra/config/caddy/Caddyfile.shared`).
- **Docker cleanup cron:** `/var/log/docker-cleanup.log`. Rotates weekly.
- **System logs:** `journalctl -u docker`, `journalctl -u containerd`,
  `journalctl -u caddy` (or whatever the service unit is named).
- **SSM command output:** in CloudWatch Logs under
  `/aws/ssm/<DocumentName>` (whatever document remote-deploy uses), and
  also stored on the SSM command history in the AWS console.

### Disk cleanup

The box fills up over time. Old Docker images and unreferenced
containerd content are the main culprits.

**Daily cleanup is automated** via
`/usr/local/bin/docker-cleanup.sh`, scheduled by
`/etc/cron.d/docker-cleanup` at 3am.

What it does:

- Prunes dangling images, unused images older than 7 days,
  stopped containers older than 24h, build cache older than 7 days,
  unused networks.
- Runs `ctr content prune references` to GC unreferenced containerd
  blobs (where the real disk usage hides).
- Does **NOT** prune volumes by default. Uncomment that line in the
  script if you're sure no anonymous volumes contain data.

**Manual cleanup if disk is full right now:**

```bash
# See where the weight is
df -h
sudo du -h --max-depth=1 /var/lib/ | sort -rh

# Docker's view
docker system df

# Cleanup, least to most aggressive
docker image prune -f                    # dangling only
docker system prune -f                   # stopped containers, unused images, networks, build cache
docker system prune -a -f                # everything not currently running
docker system prune -a -f --volumes      # plus volumes — DANGER, can delete data

# Containerd content (where the real space is)
sudo ctr content prune references

# Last resort
sudo systemctl stop docker
sudo rm -rf /var/lib/containerd/io.containerd.content.v1.content/*
sudo systemctl start docker
# Then re-deploy from CI to repopulate
```

The last-resort `rm -rf` is documented but should never be the first
move. It works because images can always be re-pulled or re-loaded from
S3 deploy artifacts.

### Docker log rotation

`/etc/docker/daemon.json` caps container log size:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Each container's logs are capped at ~30MB total. If you change this,
restart Docker (`sudo systemctl restart docker`). Already-running
containers keep their old log driver until restarted.

## Common failure modes

### "X has no exported member Y" during build

Codegen didn't run, or the barrel is stale. See "Codegen and the build
graph" above. Usually the fix is either:

- The generated file is gitignored and Docker doesn't have it →
  un-gitignore it.
- A codegen target writes into a barreled dir but `barrels` doesn't
  depend on it → add the `dependsOn`.

### Container starts then immediately exits with "cannot open serverStartUpProd.sh"

The `CMD` in the Dockerfile is resolving `${WORKSPACE_NAME}` to the
wrong value, probably because the runtime container's environment has
an overriding `APP_NAME` from the old days. Check that the Dockerfile
uses `WORKSPACE_NAME` consistently and that compose isn't injecting an
override.

### GHA deploy succeeds, app still broken

The workflow finishing green just means the SSM commands ran. Look at
`docker ps` and `docker logs` on the EC2 box to see what the containers
are actually doing. SSM command output in CloudWatch is also useful for
seeing exactly what `remote-deploy.sh` did.

### Disk full

See "Disk cleanup" above. The cron job should prevent this from
happening, but if it does, the manual cleanup steps will get you out.

### CI workflow YAML invalid

Likely the `.github/workflows/` files got out of sync with their
inputs. Especially after editing reusable workflow calls — every input
you reference has to be declared in `workflow_call.inputs` of the
called workflow. Cross-repo references (`uses: org/repo/...@ref`)
resolve to the file at that ref _on github.com_, not your local copy.

## Things that are weird but intentional

- `packages/foundation/contracts/src/enums/graphqlSmartEnums.ts` is
  generated but checked into git. This is deliberate — see "Codegen
  and the build graph."
- `infra/.github/workflows/` contains workflow files that are never
  executed. They came in via the subtree and GitHub only loads
  workflows from the root `.github/workflows/`. Harmless.
- The `media-core` project has `gen:container dependsOn ["barrels"]`,
  which sounds like it should be the other direction. It's fine
  because gen:container's output isn't barrel-indexed.

## When something breaks and you don't know where to start

1. `df -h` on EC2 — disk full?
2. `docker ps` on EC2 — are the containers even running?
3. `docker logs <name> --tail 100` — what do they say?
4. Look at the latest GHA workflow run — did the deploy actually
   succeed end-to-end?
5. Look at the SSM command history in AWS console for the most recent
   deploy — did the remote steps finish or hang?
