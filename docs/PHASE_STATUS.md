# Monorepo standardization — status handoff

## Where we are

**Standardization complete (Phases 2–9).** Policy is codified in `docs/Monorepo.md`, enforced locally via `npm run check:policy` and in CI (lint job, after `npm ci`). External deps via `syncpack` (`npm run check:deps`). Internal `@packages/*` use `"*"`; lockfile committed; CI uses `npm ci`.

## What's done

- **Phases 2–5c** — packages and apps (`api`, `media-worker`, `web`) standardized per `docs/Monorepo.md`.
- **Phase 6** — Dockerfile move: `infra/docker/Dockerfile`, `.dockerignore` for repo-root context, compose dev references updated, root `docker:build:*` scripts. Web SPA via `runtime-web` + `nginx-web.conf`. Builder runs `ts-patch install` + `NODE_OPTIONS=--import tsx` for IoC. `media-worker:build:vite` gained `heic-converter:build` dep (required for worker image build).
- **Phase 7** — Root script catalog cleanup: 95 → 56 scripts; `scope:packages` / `scope:apps` nx tags; §11 `db:*` and `test:integration:api` doc fixes.
- **Phase 8** — `syncpack@15.3.1` (exact pin), `.syncpackrc.json` (`@packages/**` + `local` ignores), `@jest/globals` drift fix in media-core, `check:deps` → `syncpack lint`, CI lint job step, `docs/Monorepo.md` §0.2 / §11 / §14 updated.
- **Phase 9** — `scripts/validate-policy.ts` (`npm run check:policy`), CI lint job step, `contracts` `baseUrl` catch-up, `api` `paths: {}` opt-out, `docs/Monorepo.md` §14 checklist aligned with validator (19 rules).

## Validation surface

- `npm run check:deps` — `syncpack lint`; zero external version drift across workspace `package.json` files.
- `npm run check:policy` — monorepo policy per `docs/Monorepo.md` §14 (19 rules; rule 13 warns until smart-enum ESLint rule exists).
- CI (`infra/.github/workflows/ci.yml` lint job): `check:deps` and `check:policy` after `npm ci` (barrels staleness included in policy check).

## Remaining work (post-standardization)

Not part of the standardization sequence. Pick up as separate streams or opportunistic cleanup.

### Separate streams

- **`.equals()` migration + smart-enum ESLint rule** — §0.1; `check:policy` rule 13 warns today, will hard-fail once the rule is written.
- **ioc-manifest composition** — separate design thread; should obsolete the IoC source/dist resolution dance.
- **Test-rebuild audit** — `build__*` direct-import smell from 5a/5b; align test compilation with §6.1 Jest `moduleNameMapper` pattern where needed.

### Known soft spots

- **Test target migration** — `contracts`, `infrastructure`, `notifications`, `web`, `media-core` still use `@nx/jest:jest` with broken `env.NODE_OPTIONS`. Migrate to §10.1 `nx:run-commands` per package when touched.
- **IoC source/dist resolution** — `api:gen:container` / worker divergence; TS noise during discovery; obsolete when ioc-manifest composition lands.
- **`api:gen:container` pre-existing failures** — distinguish from tsconfig/build regressions when validating api.
- **Caching tuning** — barrels `cache: false`, codegen inputs/outputs, `clean` in `build.dependsOn`.
- **`contracts:build` pulls `api:schema-gen`** — non-GraphQL apps inherit schema-gen via `^build`; acceptable but worth knowing.
- **CI workflow stale script references** — `gen:container`, plain `lint`/`build`/`test` in workflow and docs; not updated in Phase 9.
- **Frontend deploy Node 22 vs Docker backend Node 20** — reconcile when it bites.
- **`infra/docs/deploy.md` stale** — pre-Phase-6 Dockerfile args.
- **`infra/package.json` outside npm workspaces** — not scanned by syncpack; Prettier version may diverge.
- **No workspace-wide semver range style policy** — syncpack `semverGroups` available if drift becomes painful.
- **Stale doc references** — `README.md`, `packages/e2e/README.md`, heic-converter README, etc.
