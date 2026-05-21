# Monorepo policy: structure, builds, and deployment

This document defines how the monorepo is structured, how packages are built, how apps consume them, and how everything ships in Docker. The goal is **one consistent system from dev to prod, robust to common failure modes**, with the rules enforceable by tooling rather than by human memory.

Every package, every app, every Dockerfile follows this policy. Deviations require updating this document first.

## 0. Foundational design choices

Two choices shape the rest of this policy. Internalize these before reading further; everything below follows from them.

### 0.1 Values are compared by identity, not by reference

Smart enums (and any other identity-sensitive values shared across packages) expose an `.equals()` method. **All comparisons of such values use** `.equals()`**, never** `===`**.**

```ts
// Wrong:
if (mediaItem.kind() === MediaKind.photo) { ... }

// Right:
if (mediaItem.kind().equals(MediaKind.photo)) { ... }

```

Reference equality (`===`) fails the moment a value crosses any boundary that produces a new runtime instance: a bundler emitting duplicate copies, an ORM reviving from the database, JSON deserialization, a third-party library resolving the package independently, a worker thread, a hot-reloaded module. Each of these has bitten real codebases. Rather than chase them one by one with build configuration, we eliminate the problem at the comparison.

Enforcement: an ESLint rule bans `===` and `!==` against smart enum instances. The rule is mandatory in CI.

This decision **simplifies the rest of the policy substantially**. Build configuration no longer has to preserve runtime instance identity across the deployment pipeline. Bundles can include their own copies of shared packages. Dockerfiles don't need to copy `packages/` to keep workspace symlinks resolving. The whole class of "works in dev, fails in prod because instances differ" becomes impossible.

### 0.2 Dependency consistency is enforced by tooling

Every external dependency used by the monorepo is declared at exactly one version, used identically by every consumer. Internal `@packages/`* dependencies use the `workspace:*` protocol — no version negotiation possible.

Mechanism:

- Workspace-internal deps use `workspace:*` in every consumer's `package.json`.
- External deps are aligned across workspaces by a CI check (`syncpack list-mismatches`, or equivalent). Mismatches fail the build.
- The lockfile is committed to the repo. CI installs with `--frozen-lockfile` (or `npm ci`). Lockfile drift fails the build.
- For external deps that *must* be pinned (e.g. peer-dep alignment for React), use the package manager's overrides mechanism (`pnpm.overrides`, `npm` `overrides`, `resolutions` in yarn).

This eliminates the "I bumped X in package A but not B" and "the lockfile in CI is stale" failure classes. Both are caught at install time, not at build time and not at runtime.

## 1. Package layout

Shared packages live under `packages/`, grouped by domain:

```
packages/
  context/                 # bounded-context packages
    heic-converter/
    media-core/
    notifications/
  foundation/              # cross-cutting, used by many
    contracts/
    infrastructure/
  e2e/                     # end-to-end tests (deployable)

```

All shared packages are scoped `@packages/<name>` regardless of folder. The folder grouping is for human navigation; the package name is flat. A package's name does not include its group (`@packages/media-core`, not `@packages/context-media-core`).

Apps live under `apps/`:

```
apps/
  api/                     # Node backend
  media-worker/            # Node background worker
  web/                     # browser app

```

Apps are scoped `@app/<name>`.

## 2. Every shared package has the same shape

Every package under `packages/*/` has:

- A `package.json` matching the canonical shape (§3).
- A `tsconfig.json` extending the repo's base (§4).
- A `project.json` declaring nx targets (§5).
- A `src/` folder containing source.
- A `build` target producing `dist/`.

No package imports from another package's `src/` via relative path. Packages depend on each other only through `@packages/*` imports, resolved through `node_modules` via workspace symlinks.

## 3. Canonical `package.json`

Every shared package's `package.json` follows this template:

```json
{
  "name": "@packages/<package-name>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/src/index.js",
  "types": "./dist/src/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/src/index.d.ts",
      "default": "./dist/src/index.js"
    }
  },
  "scripts": {
    "build": "rimraf dist && nx build <package-name>",
    "dev": "tsc -w -p tsconfig.json",
    "test": "nx test <package-name>"
  }
}

```

Rules:

- `main`, `types`, and `exports."."` all point at files in `dist/`. **No package points at** `src/`**. Ever.** Pointing at source allows consumers to bundle the source, which historically caused identity-duplication problems. Even though we've removed reliance on identity (§0.1), pointing at `dist/` is still the right policy — `dist/` is what's been type-checked, what CI verified, what production runs.
- `exports."."` is the authoritative entry; `main` and `types` are kept in sync for tools that don't yet support `exports`.
- The `build` script builds *this* package, not another. (Historical bug: `media-core`'s build script ran `nx build contracts`. Audit for and fix similar copy-paste errors.)
- `type: "module"` everywhere. The repo is ESM-only.

Additional entry points (e.g. `@packages/contracts/testing`) are added to `exports`:

```json
"exports": {
  ".": { ... },
  "./testing": {
    "types": "./dist/src/testing/index.d.ts",
    "default": "./dist/src/testing/index.js"
  }
}

```

Subpath exports follow the same `dist/` rule.

Internal dependencies (other `@packages/*`) use the `workspace:*` protocol:

```json
"dependencies": {
  "@packages/contracts": "workspace:*",
  "lodash": "4.17.21"
}

```

## 4. Canonical `tsconfig.json` for shared packages

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"]
}

```

- All packages extend a single root `tsconfig.base.json`.
- `outDir: "./dist"` aligns with the `package.json` `main` field.
- `composite: true` enables TypeScript project references and incremental builds.
- `declaration: true` and `declarationMap: true` emit `.d.ts` files for consumers and source maps for editor "go to definition" through `.d.ts` back to source.

No `paths` mapping `@packages/*` to source. Packages are resolved via workspace symlinks to `dist/`, the same way in dev and prod.

## 5. Dependency graph: nx declares it once

Every package's `project.json` declares its build dependency:

```json
{
  "name": "<package-name>",
  "targets": {
    "build": {
      "dependsOn": ["^build"],
      "executor": "@nx/js:tsc",
      "options": { ... }
    }
  }
}

```

`^build` means "build all dependencies first." This makes `nx build api` automatically build `contracts`, then `media-core`, then `api`, in the right order. **Never write hand-coded build-order scripts.** All build orchestration goes through nx, which respects the declared graph.

Adding a new package requires no changes to any consumer's config — declare it as a dep in `package.json` (`"@packages/newname": "workspace:*"`), and nx handles the order. The dep graph is the single source of truth for build order.

## 6. Apps consume packages as ordinary npm dependencies

Apps import shared packages like any other dependency:

```ts
import { MediaKind } from '@packages/contracts';

```

This resolves through `node_modules/@packages/contracts` → workspace symlink → `packages/foundation/contracts/` → `package.json` `main` → `dist/src/index.js`. The resolved file is the built artifact, always.

**Apps must not import package source.** No `import { ... } from '../../../packages/foundation/contracts/src/...'`. No tsconfig `paths` shortcut. The resolution must go through `@packages/`* and hit `dist/`.

For editor navigation: with `declarationMap: true` in the package tsconfig (§4), "go to definition" jumps from the `.d.ts` to the corresponding `.ts` source. You read source; you don't *import* source.

## 7. Build configuration for apps

Apps bundling for production (via Vite or other) may bundle `@packages/`* into their output. This is permitted because (§0.1) reliance on instance identity has been eliminated — duplicate instances of `MediaKind` across bundles compare correctly via `.equals()`.

The recommended config:

```js
// vite.config.mjs
import { defineConfig } from 'vite';

export default defineConfig({
  // Bundle workspace packages into the app's output. No external for @packages/* or @app/*.
});

```

Bundling has these benefits:

- Each app is a self-contained artifact. The runtime needs only the bundle and external `node_modules`, not the source `packages/` tree.
- Dockerfiles don't need to copy `packages/`.
- Startup is faster (no workspace symlink resolution at runtime).

The cost (duplicate code across bundles) is small in absolute terms and has zero correctness impact under the §0.1 policy.

Web apps follow the same rule. Node apps follow the same rule. No app-type-specific exceptions.

## 8. Code generation

Generated code is **not checked into git**. It is regenerated:

- Locally, via a `codegen` watch script (run alongside `nx dev`).
- In Docker, as a step in the build stage, before the consuming code is built.

Every package or app with codegen:

- Has a `codegen` script in `package.json` (or an nx target).
- Has a `prebuild` (or nx `build.dependsOn`) that runs codegen first.
- `.gitignore`s the generated outputs (typically `src/generated/`).
- Codegen is **deterministic** — same input always produces same output. Non-deterministic generators are bugs to fix.

The Dockerfile (§9) runs codegen as part of the build stage. Production images contain the generated code (because they contain the built `dist/`), but it's never in the git history.

## 9. Dockerfile: one file, parameterized by app

A single Dockerfile, parameterized by the app to build, serves all deployable apps. Adding a new app requires zero changes to the Dockerfile.

```dockerfile
# === Build stage ===
FROM node:20 AS builder
WORKDIR /app

# Install package manager (replace with npm/yarn as appropriate)
RUN npm install -g pnpm@<pinned-version>

# Copy workspace metadata first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nx.json tsconfig.base.json ./

# Copy all source. The dep graph nx uses lives in these files.
COPY packages packages
COPY apps apps

# Install with frozen lockfile — fails on lockfile drift
RUN pnpm install --frozen-lockfile

# Build the target app. Nx handles codegen and dep build order.
ARG APP_NAME
RUN pnpm nx build ${APP_NAME}

# === Runtime stage ===
FROM node:20-slim AS runtime
WORKDIR /app

ARG APP_NAME

# Copy only what runtime needs: the bundled app and external node_modules.
# Because apps bundle @packages/* (§7), we do NOT need to copy packages/.
COPY --from=builder /app/apps/${APP_NAME}/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/index.js"]

```

Properties of this Dockerfile:

- **One file**, parameterized: `docker build --build-arg APP_NAME=api .`
- **Invariant to new packages**: the `COPY packages packages` line catches all current and future packages.
- **Invariant to new apps**: a new app is built by passing `APP_NAME=newapp`. No new Dockerfile.
- **Minimal runtime image**: only the target app's `dist/` plus `node_modules`. No workspace packages copied separately.
- **Layer caching**: `package.json`/lockfile copied before source means a code-only change reuses the install layer.
- **Codegen automatic**: runs in build stage as part of `nx build` (assuming codegen is declared as a build dependency per §8).

For multi-app deployments, each app is a separate `docker build` invocation with a different `APP_NAME`. They share the same Dockerfile.

## 10. Local development

In dev:

- Shared packages run their `dev` script (`tsc -w`), continuously rebuilding `dist/`.
- Apps run via `nx dev <app>` (which may use `tsx`, `vite dev`, etc.).
- `@packages/`* imports resolve through the workspace symlink to the (continuously rebuilt) `dist/`. **Same resolution path as production.** The only difference between dev and prod is the runner (`tsx` vs. `node`); the module graph is identical.

Before running any app for the first time: `nx run-many --target=build --projects='@packages/*'` to populate `dist/` directories. After that, watch mode keeps them current.

If a new shared package is added: `pnpm install` to register the workspace, then it works immediately. No config edits anywhere.

## 11. Adding a new shared package

1. Create the folder under the appropriate group (`packages/context/<name>/` or `packages/foundation/<name>/`).
2. Create `package.json` following §3 template (`name`, `main`, `exports`, `scripts`).
3. Create `tsconfig.json` following §4 template.
4. Create `project.json` with `build`, `test`, and `dev` targets, including `dependsOn: ["^build"]` on `build`.
5. Create `src/index.ts` as the entry.
6. From the repo root: `pnpm install` (registers the workspace).
7. Declare the dependency in any consumer's `package.json`: `"@packages/newname": "workspace:*"`.
8. Done. No Dockerfile change, no Vite config change, no tsconfig path additions.

## 12. Adding a new app

1. Create `apps/<name>/` with `package.json`, `tsconfig.json`, `project.json`, and `src/`.
2. Declare dependencies on shared packages with `workspace:`*.
3. Configure Vite (or whichever bundler) per §7 — bundle workspace packages.
4. Deploy with `docker build --build-arg APP_NAME=<name> .` — no Dockerfile changes needed.

## 13. Validation

A `scripts/validate-policy.ts` script checks every package against this policy. It verifies:

- Every shared package's `package.json` `main`/`types`/`exports` points at `dist/`.
- Every `build` script builds the correct package (no copy-paste bugs).
- Every package extends `tsconfig.base.json` and outputs to `dist/`.
- No app imports package source via relative path (grep for `from '../../../packages/`).
- All internal deps use `workspace:*`.
- `syncpack list-mismatches` (or equivalent) finds no external dep version drift.
- ESLint reports no `===`/`!==` against smart enum instances.

This script runs in CI. Policy violations fail the build. **This is how the policy stays enforced over time** — humans drift, CI doesn't.

## 14. Summary: the five things that matter

If you forget everything else, remember these:

1. `.equals()` **on smart enums.** Never `===`. Lint enforces.
2. `workspace:`* **for internal deps.** Lockfile committed. CI uses `--frozen-lockfile`. Syncpack catches external dep drift.
3. **Every shared package builds to** `dist/` and its `package.json` points there. No exceptions.
4. **Apps bundle** `@packages/`* into their output. Self-contained artifacts.
5. **One Dockerfile**, parameterized by app. Invariant to new packages and apps.

Everything else is detail.