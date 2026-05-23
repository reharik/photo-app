# Phase 8 Step 1 — syncpack install & drift inventory

> **Superseded by Step 2 (complete).** `check:deps` now runs `syncpack lint`. See `docs/PHASE_STATUS.md`.

Read-only inventory. No `package.json` version fixes applied.

---

## 1. syncpack install details

| Item | Value |
|------|--------|
| **Package** | `syncpack` |
| **Version** | `15.3.1` (latest stable at install time) |
| **Pin style** | Exact (`"syncpack": "15.3.1"`) — no `^` |
| **Location** | Root `devDependencies` in `/home/reharik/Development/photoapp/package.json` |
| **Config file** | `.syncpackrc.json` (repo root) |

### Why `.syncpackrc.json` (not `syncpack.config.js`)

- JSON is [syncpack’s recommended default](https://syncpack.dev/config/syncpackrc/): no Node/TS bootstrap, schema validation via `$schema`, and config is data-only (version groups, ignore rules).
- The only logic needed is declarative (`versionGroups`); a JS config would add complexity with no benefit.

### Config contents

```json
{
  "$schema": "./node_modules/syncpack/schema.json",
  "versionGroups": [
    {
      "label": "Ignore workspace-internal @packages/* (npm * protocol per Monorepo §0.2)",
      "dependencies": ["@packages/**"],
      "isIgnored": true
    }
  ]
}
```

**Mechanism:** `versionGroups` with `isIgnored: true` and `dependencies: ["@packages/**"]` — not removed `dependencyTypes` (removed in syncpack v14+). Default behavior for everything else is the built-in **Highest Semver** group (align to highest declared version in the workspace).

**Workspace coverage:** syncpack discovers packages from root `workspaces` (`apps/*`, `packages/*`, `packages/*/*`) — 10 `package.json` files. `infra/package.json` is **outside** npm workspaces and is not scanned (see edge cases).

### `check:deps` script (not updated in Step 1)

Root script still runs deprecated v13 command:

```json
"check:deps": "syncpack lint"
```

`npm run check:deps` exits **1** with a deprecation message and does not run the audit. **Step 2** applied: `syncpack lint` in `check:deps` and `docs/Monorepo.md` §11 / §14.

---

## 2. `syncpack lint` output (syncpack v15)

Command: `npx syncpack lint` (with `.syncpackrc.json` present)

```
= Default Version Group ========================================================
   1x @app/api (local)
      ! VERSION_IS_MISSING in apps/api/package.json at .version (InvalidLocalVersion) (local)
   1x @app/media-worker (local)
      ! VERSION_IS_MISSING in apps/media-worker/package.json at .version (InvalidLocalVersion) (local)
   1x @app/web (local)
      ! VERSION_IS_MISSING in apps/web/package.json at .version (InvalidLocalVersion) (local)
   2x @jest/globals
      ✘ ^30.1.2 → 30.4.1 in packages/context/media-core/package.json at .devDependencies (DiffersToHighestOrLowestSemver)
   1x photo-app (local)
      ! VERSION_IS_MISSING in package.json at .version (InvalidLocalVersion) (local)
✗ Issues found
```

### External version drift (actionable)

| Dependency | Declarations | Highest in workspace |
|------------|--------------|----------------------|
| `@jest/globals` | Root: `30.4.1` (exact); media-core: `^30.1.2` | `30.4.1` |

No other cross-package **numeric** version mismatches were reported.

### Non-drift noise (config follow-up in Step 2)

| Issue | Packages | Notes |
|-------|----------|-------|
| `VERSION_IS_MISSING` | `photo-app` (root), `@app/api`, `@app/web`, `@app/media-worker` | Private apps/root omit `.version`; syncpack v7+ treats `local` type by default. Fix: add `versionGroups` entry ignoring `dependencyTypes: ["local"]` (per [migrate v14](https://syncpack.dev/guide/migrate-v14/#workspace-dependency-syncing-enabled-by-default)), **not** by adding fake versions to apps. |

---

## 3. Proposed resolution per mismatch

### `@jest/globals`

| Field | Value |
|-------|--------|
| **Target version** | `30.4.1` (highest semver; matches root, `jest`, `jest-environment-jsdom`) |
| **Packages to change** | `packages/context/media-core/package.json` only |
| **Proposed specifier** | `30.4.1` (exact, matching root) **or** `^30.4.1` if you want to preserve caret style — numeric target is `30.4.1` either way |
| **Concerns** | Low risk. Jest 30.4.x already used at root; media-core is one minor behind on the globals package only. Aligning completes the Jest 30.4 set already used by `jest` / `jest-environment-jsdom`. |
| **Discussion needed?** | No |

**Step 2 autofix:** `npx syncpack fix --dependencies '@jest/globals'` should apply the same change after local-version ignore is configured.

---

## 4. Root `overrides` audit

**Current state:** Root `package.json` has **no** `overrides` field.

**Implications from this drift scan:**

- No peer-dependency version conflicts surfaced in declared `peerDependencies` (none exist in any workspace `package.json`).
- No immediate need for root `overrides` based on syncpack findings.
- **Optional hygiene (not required for zero mismatches):** Root mixes exact and caret for `@nx/*` on the same `21.4.1` — single package, not cross-workspace drift; see edge cases.

---

## 5. Historical drift checks

### `@aws-sdk/client-s3` (Phase 4d)

| Package | Declares `@aws-sdk/client-s3`? |
|---------|-------------------------------|
| `packages/context/heic-converter` | **No** (Lambda path removed) |
| `packages/context/media-core` | `^3.1028.0` |
| `apps/media-worker` | `^3.1028.0` |

**Clean** — two declarations, same version. No action.

### `@aws-sdk/s3-request-presigner`

Same pattern: media-core + media-worker only, both `^3.1028.0`. **Clean.**

---

## 6. Edge cases & observations

### A. syncpack v15 CLI vs Monorepo doc

- v13 audit command removed; repo uses **`syncpack lint`**.
- Semver-range lint is merged into `lint` (no separate `lint-semver-ranges`).
- Step 2: update `check:deps`, CI, `docs/Monorepo.md` §14 validation bullet.

### B. Missing `.version` on apps and root

Not external dep drift. Recommended Step 2 config addition:

```json
{
  "label": "Ignore .version on local/workspace packages",
  "dependencyTypes": ["local"],
  "isIgnored": true
}
```

(Place **after** the `@packages/**` ignore group; order matters.)

### C. `infra/package.json` outside workspaces

`infra/package.json` declares `prettier@^3.2.5` and `yaml@^2.3.4` — **not** scanned by syncpack workspace discovery. Root has `prettier@^3.6.2`. This is intentional scope (infra is not an npm workspace member). If infra deps should be governed later, add `--source` / `source` config or move tooling to root.

### D. Range operator inconsistency (same version, not flagged)

syncpack Highest Semver compares **resolved version numbers**, not range operator style. Examples that are **aligned numerically** but stylistically mixed:

| Dependency | Pattern | Location |
|------------|---------|----------|
| `@nx/esbuild`, `@nx/js`, `@nx/react`, `@nx/vite`, `nx` | exact `21.4.1` | root only |
| `@nx/eslint`, `@nx/eslint-plugin`, `@nx/jest` | `^21.4.1` | root only |
| `jest`, `jest-environment-jsdom`, `@jest/globals` (root) | exact `30.4.1` | root |
| `jest` | exact `30.4.1` | media-core |
| `heic-converter` deps | exact pins (`exifr`, `heic-convert`, `pino`) | intentional pins in one package |

**Not blocking** for Step 2 unless you add `semverGroups` to enforce uniform `^` vs exact per dependency class.

### E. `typescript` / `ioc-manifest`

- `typescript@^5.9.2` — **10 declarations**, all identical. No drift.
- `ioc-manifest@^0.3.2` — api + media-worker only, aligned. ioc-manifest’s bundled TypeScript is separate from workspace `typescript`; syncpack does not flag it.

### F. Workspace health (positive)

Multi-instance deps scanned (2+ declarations) — all numerically consistent except `@jest/globals`:

- `typescript`, `@types/node`, `@reharik/smart-enum`, `knex`, `graphql`, `pg`, `ts-patch`, `@aws-sdk/*`, `react`, `awilix`, `ioc-manifest`, `ts-jest`, etc. — **no version drift**.

---

## 7. Step 2 checklist (after your confirmation)

1. Add `local` `versionGroups` ignore for `VERSION_IS_MISSING`.
2. Fix `@jest/globals` in media-core (or `syncpack fix`).
3. Change `check:deps` → `syncpack lint`.
4. `npm install` (lockfile already updated for syncpack install).
5. Verify `npm run check:deps` exits 0.
6. `npm run build:all` / `npm run test:packages` (note known soft spots).
7. Add `npm run check:deps` to `infra/.github/workflows/*.yml`.
8. Mark Phase 8 done in `docs/PHASE_STATUS.md`; refine `docs/Monorepo.md` §0.2 if needed (`versionGroups` + `local` ignore wording).

---

## 8. Files touched in Step 1

| File | Change |
|------|--------|
| `package.json` | Added `syncpack@15.3.1` to `devDependencies` |
| `package-lock.json` | Updated by `npm install` |
| `.syncpackrc.json` | **Created** |

No workspace package versions were modified.
