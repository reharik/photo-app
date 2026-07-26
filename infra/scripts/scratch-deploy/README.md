# Scratch deploy harness — cases 2, 3, 3b

Runs the **real** [`../remote/remote-deploy.sh`](../remote/remote-deploy.sh)
against a local stack, to prove the `migrate` one-shot behaves under the
`--force-recreate --no-deps` recreate that prod uses. `remote-deploy.sh` is
never modified; only `PATH`, environment, and two host-level stubs differ.

Everything generated goes to `/tmp/homeroll-scratch-deploy` (override with
`SCRATCH_DIR`), so nothing generated lands in the repo. The variable is
deliberately not called `WORK_DIR` — `remote-deploy.sh` has its own.

## Why this isn't just `prod.yml`

`prod.yml` pins `platform: linux/arm64`; dev boxes are amd64. `prep.sh`
generates `scratch.yml` — prod.yml with the arm64 pin dropped and `env_file`
repointed. **`base.yml` is copied verbatim**, and base.yml is where everything
under test lives: the `migrate` one-shot, `restart: "no"`, and the
`service_completed_successfully` gates. The overlay contributes nothing the
tests depend on.

Three stubs:

| Stub | Why |
|---|---|
| `/usr/local/bin/betaname-backup.sh` | hardcoded in `remote-deploy.sh`, not PATH-redirectable |
| `${SCRATCH_DIR}/bin/aws` (exit 1) | makes `download_if_exists()` short-circuit to the staged compose dir instead of S3 |
| `${SCRATCH_DIR}/bin/sudo` (passthrough) | see below |

**The sudo shim matters.** `remote-deploy.sh` runs compose as `sudo -E docker
compose …`, and `-E` preserves the environment only if sudoers permits it. Under
SSM the script already runs as root, so this never comes up in prod. On a
workstation the default policy strips `APP_NAME` and `API_IMAGE`, compose then
resolves `${API_IMAGE:-${APP_NAME}-api:latest}` to the invalid reference
`-api:latest`, and the deploy dies before migrate ever runs:

```
unable to get image '-api:latest': invalid reference format
remote-deploy.sh EXIT CODE = 1
```

The shim strips leading flags and execs the command directly, so exported
variables survive. Docker needs no root for a user in the `docker` group, and
every other sudo'd path in the script lives under `SCRATCH_DIR` in `/tmp`.

## One-time setup

```bash
cd infra/scripts/scratch-deploy
chmod +x *.sh          # exec bits are not set in the committed tree
sudo install -m 0755 betaname-backup.sh /usr/local/bin/betaname-backup.sh
./prep.sh
```

Every `./script.sh` below also works as `bash script.sh` if you skip the chmod.

## Run everything

```bash
./run-all.sh            # cases 3, 3b, 2 with assertions; keeps images for reruns
./run-all.sh --clean    # also tears down the stack and removes images afterwards
```

Exits 0 only if every assertion passes, so it drops straight into CI or a
pre-merge check. It tears the stack down and rebuilds from scratch each run, and
removes the fixture migrations from `apps/api/db/migrations` on **every** exit
path — success, assertion failure, or Ctrl-C — so a half-finished run can never
leave `0024_scratch_broken.ts` lying in the migrations directory.

Per-deploy logs land in `${SCRATCH_DIR}/logs/`. Three image builds run, which is
the slow part.

The sections below document what each case proves and how to run it by hand.

## Case 3 — the one that actually matters

Proves a migration shipped in a *second* deploy still applies even though the
recreate uses `--force-recreate --no-deps`.

```bash
# 1. First deploy: baseline schema, stack comes up.
./build-image.sh sha001
./run-deploy.sh sha001 api                    # expect exit 0
./assert.sh tables                            # scratch_probe = f

# 2. Add the probe migration and deploy a SECOND time.
cp fixtures/0023_scratch_probe.ts ../../../apps/api/db/migrations/
./build-image.sh sha002
./run-deploy.sh sha002 api                    # expect exit 0
./assert.sh tables                            # scratch_probe MUST be t
```

**PASS** = `scratch_probe present : t` and `0023_scratch_probe.js` in
`knex_migrations`. **FAIL** — the regression this whole change exists to
prevent — = `scratch_probe present : f` with the deploy still reporting exit 0.

## Case 3b — worker-only deploy, exercising the API_IMAGE fallback

`remote-deploy.sh` pins `API_IMAGE` to this SHA only when the deploy actually
loaded that image; a worker-only deploy falls back to the running api image.
This runs case 3 down that fallback branch.

`scratch.yml` defines a stub `media-worker` (alpine + `sleep infinity`) standing
in for the generated prod worker overlay, so the recreate loop has a non-api
backend service to target. Without it the deploy dies on "no such service" and
masks the fallback branch under test.

```bash
./prep.sh                                         # if scratch.yml predates the stub worker
docker image rm homeroll-api:sha003 2>/dev/null   # ensure the pinned tag is absent
./run-deploy.sh sha003 media-worker               # expect exit 0
```

**PASS** = log line `API_IMAGE=… (reused from running api; this deploy built no
api image)`, migrate runs, deploy exits 0. **FAIL** = a registry pull attempt
for `homeroll-api:sha003`.

## Case 2 — failed migration aborts the deploy

```bash
cp fixtures/0024_scratch_broken.ts ../../../apps/api/db/migrations/
./build-image.sh sha004
API_BEFORE=$(./assert.sh api-container-id)
./run-deploy.sh sha004 api                    # expect NON-ZERO
API_AFTER=$(./assert.sh api-container-id)
[ "$API_BEFORE" = "$API_AFTER" ] && echo "PASS: api was not recreated"
```

**PASS** = non-zero exit code, the `Recreating compose services:` line never
printed, and the api container id unchanged.

## Cleanup

```bash
rm -f ../../../apps/api/db/migrations/0023_scratch_probe.ts \
      ../../../apps/api/db/migrations/0024_scratch_broken.ts
docker compose -p homeroll-scratch down -v
sudo rm -f /usr/local/bin/betaname-backup.sh
docker image rm homeroll-api:sha001 homeroll-api:sha002 homeroll-api:sha004
rm -rf /tmp/homeroll-scratch-deploy
```

The fixture migrations live in `fixtures/` and are committed there. The
**copies** the tests place into `apps/api/db/migrations/` must never be
committed — `0024` would ship a guaranteed-failing migration to prod. Check
`git status` before merging.
