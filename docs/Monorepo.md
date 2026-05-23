# Monorepo policy: structure, builds, and deployment

This document defines how the monorepo is structured, how packages are built, how apps consume them, and how everything ships in Docker. The goal is **one consistent system from dev to prod, robust to common failure modes**, with the rules enforceable by tooling rather than by human memory.

Every package, every app, every Dockerfile, every script follows this policy. Deviations require updating this document first. **No exceptions** — except for one explicit category (§2.1, test-runner packages) that is itself a documented part of the policy.

---

## 0. Foundational design choices

Four choices shape the rest of this policy. Internalize these before reading further; everything below follows from them.

### 0.1 Values are compared by identity, not by reference

Smart enums (and any other identity-sensitive values shared across packages) expose an `.equals()` method. **All comparisons of such values use `.equals()`, never `===`.**

```ts
// Wrong:
if (mediaItem.kind() === MediaKind.photo) { ... }

// Right:
if (mediaItem.kind().equals(MediaKind.photo)) { ... }
```

Reference equality (`===`) fails the moment a value crosses any boundary that produces a new runtime instance: a bundler emitting duplicate copies, an ORM reviving from the database, JSON deserialization, a third-party library resolving the package independently, a worker thread, a hot-reloaded module. Each of these has bitten real codebases. Rather than chase them one by one with build configuration, we eliminate the problem at the comparison.

Enforcement: an ESLint rule bans `===` and `!==` against smart enum instances. The rule is mandatory in CI.

This decision simplifies the rest of the policy substantially. Build configuration no longer has to preserve runtime instance identity across the deployment pipeline. Bundles can include their own copies of shared packages. Dockerfiles don't need to copy `packages/` to keep workspace symlinks resolving. The whole class of "works in dev, fails in prod because instances differ" becomes impossible.

### 0.2 Dependency consistency is enforced by tooling

Every external dependency used by the monorepo is declared at exactly one version, used identically by every consumer. Internal `@packages/*` dependencies use the npm wildcard protocol — `"*"` — which npm resolves through workspaces to the local package.

Mechanism:

- Workspace-internal deps use `"*"` in every consumer's `package.json`. **Not pinned strings like `"0.1.0"`.** Pinned strings produce silent drift across the workspace; `"*"` resolves to the workspace package because the root `package.json` declares `workspaces`.
- **Not `"workspace:*"`** — that's pnpm/yarn syntax. npm errors out with "Unsupported URL Type" when it encounters it.
- External deps are aligned across workspaces by a CI check (`syncpack lint` via `npm run check:deps`). Mismatches fail the build.
- The lockfile (`package-lock.json`) is committed. CI installs with `npm ci`. Lockfile drift fails the build.
- For external deps that _must_ be pinned across workspaces (e.g. peer-dep alignment for React), use npm's `overrides` mechanism at the root `package.json`.
- `.syncpackrc.json` at the repo root configures syncpack: `versionGroups` with `isIgnored: true` for `@packages/**` (internal `"*"` deps) and for `dependencyTypes: ["local"]` (missing `.version` on apps/root). Everything else uses syncpack's default Highest Semver policy.

This eliminates the "I bumped X in package A but not B" and "the lockfile in CI is stale" failure classes. Both are caught at install time, not at build time and not at runtime.

### 0.3 Scripts are thin; the root is the control panel

There are two rules, and they're inseparable.

**Rule 1 — `package.json` scripts are thin aliases.** A single line calling `nx <target> <project>` (or `nx run <project>:<variant-target>` for targets with `:` in the name). No shell pipelines (`&&`, `;`, `|`). No inline `rimraf`. No multi-step composition. The pattern `"build": "rimraf dist && nx build foo"` is wrong; correct is `"build": "nx build foo"`, with the clean step encoded as a `clean` target in `project.json` that `build` depends on.

**All real work — clean steps, options, target ordering, `dependsOn` chains — lives in `project.json`.** Scripts are entry points only. This makes nx the single source of truth for what builds do; scripts are the human interface to nx.

**Rule 2 — the root `package.json` is the canonical command surface.** Every command the user runs day-to-day is `npm run <script>` from the repo root. Naming convention:

- **Per-package commands**: `<verb>:<package>` — `build:api`, `test:contracts`, `dev:web`, `codegen:contracts`, `schema-gen:api`, `barrels:media-core`.
- **Cross-cutting commands**: `<verb>:all` — `build:all`, `test:all`, `lint:all`, `typecheck:all`, `clean:all`.
- **Grouped subsets** if useful: `<verb>:packages`, `<verb>:apps`.
- Each script is one line: `nx <target> <project>`, `nx run <project>:<target>`, or `nx run-many --target=<target> --projects=<filter>`.
- **Cross-cutting commands MUST exclude test-runner packages** (§2.1) via `--exclude=tag:scope:test-runner`. Otherwise `test:all` would invoke Playwright against a stack that may not be running.

Per-package `package.json` scripts exist but are minimal — single-line aliases for the rare `cd` case. The root is canonical. The user never types `nx` directly and never `cd`s into a package to run a command.

### 0.4 Package manager is npm

Lockfile (`package-lock.json`) committed. CI uses `npm ci`. Workspaces declared in the root `package.json`'s `workspaces` field — no separate workspace config file. Dep-consistency tool is `syncpack`. This is a settled choice; pnpm/yarn migrations are not contemplated.

---

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
  e2e/                     # end-to-end tests (test-runner — see §2.1)
```

All shared packages are scoped `@packages/<name>` regardless of folder. The folder grouping is for human navigation; the package name is flat. A package's name does not include its group (`@packages/media-core`, not `@packages/context-media-core`).

The nx project name may differ from the npm package name for clarity: `@packages/media-core` has nx project name `media-core` so root scripts read `nx build media-core` rather than `nx build @packages/media-core`. Set `"name": "<short>"` in `project.json` to control this.

Apps live under `apps/`:

```
apps/
  api/                     # Node backend
  media-worker/            # Node background worker
  web/                     # browser app
```

Apps are scoped `@app/<name>`.

Infrastructure files live under `infra/`:

```
infra/
  docker/                  # Dockerfile(s), .dockerignore
  config/                  # shared nx and tsconfig base configs
  ...                      # deploy scripts, compose files, etc.
```

The root contains only: `package.json`, `package-lock.json`, `nx.json`, `tsconfig.base.json`, `.gitignore`, `README.md`, `docs/`, `apps/`, `packages/`, `infra/`. No Dockerfiles, no deploy scripts, no `docker-compose.yml` at the root.

---

## 2. Every shared library package has the same shape

Every package under `packages/*/` that is a **library** (consumed by importing it) has:

- A `package.json` matching the canonical shape (§3).
- A `tsconfig.json` extending the repo's base (§4).
- A `project.json` declaring nx targets (§5).
- A `src/` folder containing source.
- A `build` target producing `dist/`.

No package imports from another package's `src/` via relative path. Packages depend on each other only through `@packages/*` imports, resolved through `node_modules` via workspace symlinks.

No exceptions for "small" or "JS-only" or "legacy" packages. Heic-converter, which was historically JS-only with no tsconfig and `exports` pointing at source, has been brought up to this shape. Notifications, which had a different `dist/` layout and root-level entry, has been normalized.

### 2.1 Test-runner packages

A package whose purpose is to **run tests against a deployed stack** (rather than be imported as a library) follows a reduced shape:

- Has `package.json`, `tsconfig.json` extending the base, and `project.json` with required targets — same nx integration expectations as library packages.
- Does **not** have `main`, `types`, `exports`, `build`, or `dist/`. The deliverable is "tests run successfully," not a consumable artifact.
- Source layout is **not** required to use `src/`; runner-specific layouts (e.g. Playwright's `tests/`, `fixtures/`, `playwright.config.ts` at package root) are allowed.
- Required `project.json` targets: `test`, `typecheck`, `lint`. No `build`, `barrels`, or `codegen`.
- **Tagged in `project.json` with `scope:test-runner`** so cross-cutting commands that would invoke tests without a live stack exclude it (see §11).
- Documents runtime prerequisites in the package's `README.md`: which apps must be running, which services (database, object storage), seed data, default ports.
- The "build chain" is conceptual: bring up the stack manually (`npm run dev:api`, `npm run dev:web`, `npm run dev:worker`, docker compose, etc.) → run `npm run test:e2e` from the repo root.

Currently `@packages/e2e` is the only test-runner package. Add others under this section if they emerge.

This is the **only** exception to the library shape, and it's a category distinction, not a per-package carve-out.

---

## 3. Canonical `package.json` (library packages)

Every shared library package's `package.json` follows this template:

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
    "build": "nx build <package-name>",
    "test": "nx test <package-name>",
    "lint": "nx lint <package-name>",
    "dev": "nx dev <package-name>"
  }
}
```

Rules:

- `main`, `types`, and `exports."."` all point at files in `dist/`. **No package points at `src/`. Ever.** Even though we've removed reliance on instance identity (§0.1), pointing at `dist/` is still the right policy — `dist/` is what's been type-checked, what CI verified, what production runs.
- `exports."."` is the authoritative entry; `main` and `types` are kept in sync for tools that don't yet support `exports`.
- Scripts are thin (§0.3). No `rimraf dist && ...`; the clean step is a `clean` target in `project.json` that `build` depends on.
- The `build` script builds _this_ package, not another. (Historical bug: `media-core`'s build script ran `nx build contracts`. Always check.)
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

Subpath exports follow the same `dist/` rule. **Don't add subpath exports speculatively** — every export is API surface that constrains future refactors. Phase-4 cleanup deleted unused subpath exports from `heic-converter` because they had no consumers; do the same as a matter of course.

**Internal dependencies use `"*"`:**

```json
"dependencies": {
  "@packages/contracts": "*",
  "lodash": "4.17.21"
}
```

Not `"0.1.0"` (silent drift across workspace). Not `"workspace:*"` (pnpm/yarn syntax — npm rejects it with "Unsupported URL Type").

---

## 4. Canonical `tsconfig.json` for library packages

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "./dist",
    "rootDir": ".",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"]
}
```

- All packages extend a single root `tsconfig.base.json` (which itself extends `infra/config/tsconfig/tsconfig.base.json`).
- **`baseUrl: "."` is required.** The `@nx/js:tsc` executor auto-injects `paths` for workspace dependencies during builds, and TypeScript requires `baseUrl` to be set when `paths` are present. Without it, builds fail with `TS5090: Non-relative paths are not allowed when 'baseUrl' is not set.` Include `baseUrl` even in packages with no current internal deps — it preempts breakage if a dep is added later.
- `outDir: "./dist"` aligns with the `package.json` `main` field.
- `composite: true` enables TypeScript project references and incremental builds.
- `declaration: true` and `declarationMap: true` emit `.d.ts` files for consumers and source maps for editor "go to definition" through `.d.ts` back to source.

**No `paths` mapping `@packages/*` to source.** Packages are resolved via workspace symlinks to `dist/`, the same way in dev and prod. Apps with `paths` mapping `@packages/contracts` to `packages/foundation/contracts/src/index.ts` must remove those mappings.

**Apps extending a root tsconfig that defines `paths`:** The repo root `tsconfig.json` may map `@packages/*` to source for editor convenience. Apps must opt out: set `baseUrl: "."` and `paths: {}` in the app's `tsconfig.json`. App code resolves `@packages/*` through workspace symlinks to built `dist/` (§6); inherited source-paths break that.

### 4.1 Module resolution: `bundler` vs `NodeNext`

The base tsconfig uses `moduleResolution: "bundler"`. Packages may override this only when there's a specific reason.

**`NodeNext` is incompatible with default barrelsby output.** Barrelsby generates extensionless re-exports (`export * from './foo'`), which `NodeNext` rejects with `TS2835: Relative import paths need explicit file extensions`. If a package genuinely needs `NodeNext` (Node-native ESM, no bundler), it must either:

- Configure barrelsby to emit `.js` extensions in its output, OR
- Exclude `barrels` from its build chain and hand-maintain `index.ts` files.

In practice, all library packages bundle via Vite (the consuming apps' bundler), so `bundler` resolution is correct and `NodeNext` is unnecessary. If a future package genuinely needs `NodeNext` (e.g. for a Node-only deployment path that doesn't go through Vite), handle the barrels question explicitly.

### 4.2 TypeScript `declaration: true` and library type leakage

`declaration: true` requires every exported value's type to be **nameable in the emitted `.d.ts`**. If a function's inferred return type references a type that lives in a dependency's internal/chunked output (rather than its public exports), TypeScript fails with `TS2742: The inferred type of X cannot be named without a reference to <internal path>.`

Cause: the dependency library doesn't export the type publicly. Fix is in the dependency, not in your code: export the leaked type from the library's public entry, OR add explicit return-type annotations to break the inference chain at a public type.

If you encounter `TS2742` from a third-party library, prefer fixing the library if it's yours; fall back to explicit annotations if not.

---

## 5. Dependency graph: nx declares it once

Every library package's `project.json` declares its build dependencies:

```json
{
  "name": "<package-name>",
  "targets": {
    "clean": { ... },
    "barrels": { ... },
    "codegen": { ... },
    "build": {
      "dependsOn": ["clean", "barrels", "codegen", "^build"],
      "executor": "@nx/js:tsc",
      "options": { ... }
    }
  }
}
```

- `clean`, `barrels`, `codegen` are targets at this package's level (if applicable).
- `^build` means "build all dependencies first."
- `dependsOn` is the only place build order is expressed. **Never write hand-coded build-order scripts.** All build orchestration goes through nx, which respects the declared graph.

Adding a new package requires no changes to any consumer's config — declare it as a dep in `package.json` (`"@packages/newname": "*"`), and nx handles the order via `^build`. The dep graph is the single source of truth for build order.

### 5.1 Cross-target dependencies

A target can depend on a target on _another_ project: `dependsOn: ["other-project:other-target"]`. This is how codegen wires across project boundaries (e.g. `contracts:codegen` depends on `api:schema-gen`).

**Caveat:** nx 21.x silently _skips_ a `dependsOn` entry that references a target that doesn't exist. The build doesn't fail; the missing dep is just not scheduled. This means the dep graph alone isn't sufficient defense against missing upstream codegen. Whenever a codegen target depends on input produced by another project, **also** include a fail-fast freshness check in the codegen step:

```jsonc
// project.json codegen target
{
  "executor": "nx:run-commands",
  "options": {
    "commands": [
      "test -f apps/api/src/graphql/generated/schema.graphql || (echo 'ERROR: Schema file not found. Run npm run schema-gen:api first.' && exit 1)",
      "graphql-codegen --config codegen.yml",
    ],
    "parallel": false,
  },
}
```

Belt and suspenders: dep graph + freshness check. The graph schedules the work; the freshness check catches the case where nx silently skipped it.

### 5.2 Caching observations

The `@nx/js:tsc` executor caches its output correctly. But several other targets routinely re-execute even on unchanged inputs:

- A `clean` target included in `build.dependsOn` runs every build and partially defeats build caching (clean → new fingerprint → re-build). The `@nx/js:tsc` executor handles output cleaning natively; explicit `clean` targets in `dependsOn` are probably unnecessary. **Investigate per package** — preserve the `clean` _target_ (for manual `npm run clean:<package>`) but consider removing it from `build.dependsOn`.
- `barrels` typically has `cache: false` because the executor reads file listings rather than declared inputs. If barrelsby supports listing input dirs as nx-cacheable inputs, enabling caching would help. Worth investigating later.
- Codegen targets producing files into source dirs need explicit `inputs` and `outputs` in `project.json` to cache; without them, every invocation runs from scratch.

These are **optimization concerns, not correctness concerns**. Build correctness comes first; caching can be tuned after the policy is fully applied.

### 5.3 nx target naming and the colon issue

Targets with `:` in the name (e.g. `test:headed`, `gen:container`) **cannot** be invoked as `nx <target> <project>`. They require the `nx run <project>:<target>` form. This affects how thin scripts are written:

```jsonc
// Wrong:
"test:e2e:headed": "nx test:headed e2e"

// Right:
"test:e2e:headed": "nx run e2e:test:headed"
```

The plain `test` target (no colons) works with both forms. Variant targets with colons require `nx run`. Apply consistently in script naming.

---

## 6. Apps consume packages as ordinary npm dependencies

Apps import shared packages like any other dependency:

```ts
import { MediaKind } from '@packages/contracts';
```

This resolves through `node_modules/@packages/contracts` → workspace symlink → `packages/foundation/contracts/` → `package.json` `main` → `dist/src/index.js`. The resolved file is the built artifact, always.

**Apps must not import package source.** No `import { ... } from '../../../packages/foundation/contracts/src/...'`. No tsconfig `paths` shortcut. The resolution must go through `@packages/*` and hit `dist/`.

Existing relative imports from app source into package source (e.g. `apps/api/src/tests/...` → `packages/context/media-core/src/domain/...`) must be eliminated. If app code legitimately needs something from a package, the package exports it; the app imports it through `@packages/<name>`.

For editor navigation: with `declarationMap: true` in the package tsconfig (§4), "go to definition" jumps from the `.d.ts` to the corresponding `.ts` source. You read source; you don't _import_ source.

### 6.1 Codegen and test tooling exceptions

Two cases where tools legitimately access package source, **not** runtime imports:

- **Codegen tools that introspect TypeScript AST** (e.g. `ioc-manifest` scanning for decorated classes, GraphQL codegen reading schemas) need to read source files. Their input is `.ts` source, not compiled `.js`. This is build-time tooling, not runtime code. Configure these tools to scan package source paths; the resulting generated code is consumed normally through `@packages/*` imports against `dist/`.

- **Jest `moduleNameMapper` may map `@packages/*` to package source** (e.g. `packages/foo/src/index.ts`) rather than `dist/`. `ts-jest` compiles source on the fly, so tests don't require packages to be pre-built. There's no correctness difference vs. mapping to `dist/` under §0.1, and source-mapping keeps the inner test loop fast. The runtime app code still resolves through workspace symlinks to `dist/` — only the test runner uses source.

Both are tooling-layer concerns, distinct from runtime imports. Runtime app code goes through `@packages/*` → workspace symlink → `dist/`, no exceptions.

---

## 7. Build configuration for apps

Apps bundling for production (via Vite or other) **bundle `@packages/*` into their output**. This is permitted because (§0.1) reliance on instance identity has been eliminated — duplicate instances of `MediaKind` across bundles compare correctly via `.equals()`.

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

No app-type exceptions. Web apps follow the same rule. Node apps follow the same rule. All app Vite configs are explicit and consistent about bundling `@packages/*`.

**Browser apps:** "Bundle `@packages/*`" means Vite includes the package code in the static output (default behavior — no `external()` for workspace packages). Do **not** use the `vite-tsconfig-paths` plugin. Rely on workspace symlinks → built `dist/`; the app's `build.dependsOn` ensures dependencies are built first.

---

## 8. Code generation

Generated code splits into two categories with different policies.

### 8.1 Codegen outputs are NOT checked into git

The repo has three real codegen pipelines:

- **GraphQL schema generation** in `apps/api`: produces `apps/api/src/graphql/generated/schema.graphql` and `types.generated.ts` from hand-written `.graphql` files.
- **Smart-enum codegen** in `@packages/contracts`: produces `packages/foundation/contracts/src/enums/graphqlSmartEnums.ts` from api's generated schema.
- **IoC manifest generation** in each app: produces `apps/<app>/src/di/generated/ioc-manifest.ts` and `ioc-registry.types.ts` from `ioc.config.ts` and scanned source.

**IoC `scanDirs` paths:** point at package source directories, e.g. `packages/context/media-core/src` with `importMode: 'root'` and the matching `importPrefix`. Do not use the package root (no `/src`) — discovery against the root is a footgun.

**All three outputs are gitignored. None are committed.** The previous pattern of committing `schema.graphql` and `graphqlSmartEnums.ts` as fallbacks for ordering issues is removed. The dep graph enforces correct order; ordering failures should fail fast and loud at build time, not be papered over by stale committed artifacts.

Each generator:

- Has a target declared in `project.json` (`schema-gen` on api, `codegen` on contracts, `gen:container` on each app).
- Is wired into the dependency graph via `dependsOn` so consumers automatically trigger it. **In particular: `contracts:build.dependsOn` includes `contracts:codegen`, and `contracts:codegen.dependsOn` includes `api:schema-gen`.** This was the missing link before standardization.
- Has its output path in `.gitignore`.
- Has a **fail-fast freshness check** if it consumes a file produced by another project's target (§5.1).
- Is deterministic — same input always produces same output. Non-deterministic generators are bugs to fix.

The Dockerfile (§9) runs the full nx build chain, which triggers all codegen automatically. Production images contain the generated code (because they contain the built `dist/`), but the source-form generated files are never in the git history.

#### IoC generator TS noise

The IoC generator runs TypeScript-based discovery on app source. During the build chain — _before_ downstream codegen has produced the files that IoC discovery will eventually find — the discovery pass reports TS errors about missing modules. These are **expected and meaningless**: they're noise from running TS against an intentionally incomplete graph, not real errors about your code.

The IoC step's exit code is 0 in this case; the build continues. Real type errors are caught by the subsequent `nx build` pass against the _complete_ graph.

Suppress the noise where possible:

- Check if `ioc-manifest` (or the equivalent generator) has a `--quiet` or `--no-type-check` flag and use it.
- Failing that, redirect the generator's stderr to a log file shown only on actual non-zero exit.

Treat this as a cleanup task, not a blocker. Real type errors are not suppressed — only the discovery-phase noise.

### 8.2 Barrels ARE checked into git

Barrelsby outputs (`index.ts` files re-exporting a directory's contents) are different from the codegen above:

- They're consumed as ordinary source by the rest of the codebase.
- They aren't downstream of an external system — they're an organizational tool over your own source.
- Their content is fully determined by the file structure, so diffs are predictable.

**Barrels are committed to git.** They live in `src/` (not `src/generated/`). Every library package gets a `barrels` target in `project.json`. The `build` target's `dependsOn` includes `barrels` so the barrels are always current at build time.

CI runs `npm run barrels:all` and fails if anything changed — this catches "someone added an export and didn't re-barrel."

#### When NOT to barrel a directory

Barrelsby unconditionally overwrites the `index.ts` in any directory it's pointed at. If a directory's `index.ts` is **hand-written** and does anything beyond plain re-exports — a registry, a factory, named exports with specific shapes, anything semantically meaningful — **exclude that directory from barrelsby**.

This pattern emerged in `@packages/notifications`, where `templates/index.ts` was a hand-written registry mapping template names to React components. Barrelsby replaced it with `export * from './welcome'` etc., which broke the registry. The fix was to scope `barrelsby.json` to plain re-export directories only and leave the registry alone.

Rule of thumb: if `index.ts` for a directory has any logic, conditional exports, or anything other than re-exports, that directory does not belong in `barrelsby.json`.

### 8.4 Browser-app GraphQL schema copy

When a browser app bundles GraphQL SDL via `?raw` at build time, keep a **local** generated copy under the app's source tree (e.g. `apps/web/src/graphql/generated/schema.graphql`), produced by an nx target (`sync-schema`) with `dependsOn: ["api:schema-gen"]`. Include a §5.1 freshness check before the copy. **Codegen config must read that same local path**, not reach into another app's directory. Runtime imports and codegen share one file.

### 8.3 The full codegen dependency chain

```
apps/api/src/graphql/schema/*.graphql        (hand-written, committed)
    ↓
api:schema-gen
    ↓
apps/api/src/graphql/generated/schema.graphql           (gitignored)
apps/api/src/graphql/generated/types.generated.ts       (gitignored)
    ↓
contracts:codegen   [freshness-checks schema.graphql existence]
    ↓
packages/foundation/contracts/src/enums/graphqlSmartEnums.ts  (gitignored)
    ↓
contracts:barrels  →  contracts:build
    ↓
(infrastructure, media-core, heic-converter, notifications build via ^build)
    ↓
api:gen:container  /  media-worker:gen:container
    ↓
apps/{api,media-worker}/src/di/generated/*  (gitignored)
    ↓
api:build  /  media-worker:build
    ↓
web:sync-schema  (copies api schema into apps/web/src/graphql/generated/)
    ↓
web:codegen  (consumes local synced schema, produces web GraphQL types)
    ↓
web:build
```

This entire chain is encoded in `project.json` `dependsOn` declarations. No `prepare` script, no hand-ordered `run-many` invocation. The pre-standardization pattern in `api:prepare` — explicit `run-many -t build -p contracts infrastructure media-core` followed by codegen — is replaced by proper `dependsOn` edges. `nx build api` correctly produces the full chain in order without any orchestration script.

---

## 9. Dockerfile: one file in `infra/`, parameterized by app

A single Dockerfile at `infra/docker/Dockerfile`, parameterized by the app to build, serves all deployable apps. Adding a new app requires zero changes to the Dockerfile.

```dockerfile
# === Build stage ===
FROM node:20 AS builder
WORKDIR /app

# Copy workspace metadata first for layer caching
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./
COPY infra infra

# Copy all source
COPY packages packages
COPY apps apps

# Install with frozen lockfile — fails on lockfile drift
RUN npm ci

# Build the target app. Nx handles codegen and dep build order via dependsOn.
ARG APP_NAME
RUN npx nx build ${APP_NAME}

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

Properties:

- **One file**, in `infra/docker/Dockerfile`, parameterized: `docker build -f infra/docker/Dockerfile --build-arg APP_NAME=api .` (build context is the repo root).
- **Only apps containerize.** Shared packages aren't built into their own images. Each app's image contains the app's bundled output (which includes its dependent packages' code via Vite bundling).
- **Invariant to new packages**: the `COPY packages packages` line catches all current and future packages.
- **Invariant to new apps**: a new app is built with `APP_NAME=newapp`. No new Dockerfile.
- **Minimal runtime image**: only the target app's `dist/` plus `node_modules`. No workspace packages copied separately.
- **Layer caching**: `package.json`/lockfile copied before source means a code-only change reuses the install layer.
- **Codegen automatic**: runs in build stage as part of `nx build` (because `dependsOn` chains pull it in).
- **No `prepare` step**, no manual orchestration in the Dockerfile. `nx build ${APP_NAME}` is sufficient because the graph is correct (§8.3).
- **Browser apps use a separate runtime target.** The example above is the Node runtime (`runtime-node`). Static frontends (`web`) use `runtime-web` (nginx serving `apps/web/dist`). See `infra/docker/Dockerfile` for both targets; build with `--target runtime-web --build-arg APP_NAME=web`.

---

## 10. Local development

In dev:

- Shared packages run their `dev` script (`nx dev <package>`), continuously rebuilding `dist/`.
- **`nx dev <app>` is the canonical entry point.** Node apps (`api`, `media-worker`): `nx dev <app>` → nodemon watching the app's `src/` plus dependency `packages/*/dist`. Browser apps (`web`): `nx dev web` → `@nx/vite:dev-server` (Vite HMR). Apps that still use `tsx watch` or `nx serve` should be aligned to `nx dev <app>`.
- **Browser `dev` must declare `dependsOn: ["codegen"]` (or equivalent).** `@nx/vite:dev-server`'s `buildTarget` option does not run the referenced target's nx dependency chain on startup — it only supplies Vite config. Without explicit `dependsOn`, a fresh checkout with no local `src/graphql/generated/` will start the dev server without schema sync or GraphQL codegen. Codegen runs once per `nx dev web` invocation (not on HMR).
- `@packages/*` imports resolve through the workspace symlink to the (continuously rebuilt) `dist/`. **Same resolution path as production.** Dev uses `tsx` under nodemon; production uses `node` on the built bundle; the module graph is identical.

Before running any app for the first time: `npm run build:packages` to populate `dist/` directories. After that, watch mode keeps them current.

If a new shared package is added: `npm install` to register the workspace, then it works immediately. No config edits anywhere.

The dev `docker-compose` configuration mounts `packages/` into containers — this is fine for dev (where source watching works); the production Dockerfile (§9) does not need this because apps bundle their packages.

### 10.1 Jest ESM tests and `@nx/jest:jest`

In nx 21.4.x, the `@nx/jest:jest` executor's `options.env.NODE_OPTIONS` mechanism is broken: setting `NODE_OPTIONS: '--experimental-vm-modules'` (required for Jest with ESM) causes Jest to fail at config-load time with `filePath.startsWith is not a function`.

Workaround: instead of `@nx/jest:jest` with `options.env`, use `nx:run-commands` with inline NODE_OPTIONS:

```jsonc
"test": {
  "executor": "nx:run-commands",
  "options": {
    "command": "NODE_OPTIONS='--experimental-vm-modules' jest",
    "cwd": "{projectRoot}"
  }
}
```

Apply this pattern wherever Jest tests run against ESM-only code (any package using `type: "module"` and ESM imports in tests).

---

## 11. The root `package.json` script catalog

The full set of root scripts. This is the canonical list. The user types these and only these.

```jsonc
{
  "scripts": {
    "build:all": "nx run-many --target=build --all",
    "build:packages": "nx run-many --target=build --projects=tag:scope:packages",
    "build:apps": "nx run-many --target=build --projects=tag:scope:apps",
    "build:contracts": "nx build contracts",
    "build:infrastructure": "nx build infrastructure",
    "build:media-core": "nx build media-core",
    "build:heic-converter": "nx build heic-converter",
    "build:notifications": "nx build notifications",
    "build:api": "nx build api",
    "build:web": "nx build web",
    "build:worker": "nx build media-worker",

    "dev:api": "nx dev api",
    "dev:web": "nx dev web",
    "dev:worker": "nx dev media-worker",
    "dev:contracts": "nx dev contracts",

    // test:all and test:ci EXCLUDE test-runner packages (§2.1)
    "test:all": "nx run-many --target=test --all --exclude=tag:scope:test-runner",
    "test:ci": "nx run-many --target=test --all --exclude=tag:scope:test-runner",
    "test:contracts": "nx test contracts",
    "test:media-core": "nx test media-core",
    "test:api": "nx test api",
    "test:web": "nx test web",
    "test:worker": "nx test media-worker",
    "test:integration:api": "nx run api:test-integration",

    // Variant test targets use `nx run` form because of the colon (§5.3)
    "test:e2e": "nx test e2e",
    "test:e2e:headed": "nx run e2e:test:headed",
    "test:e2e:ui": "nx run e2e:test:ui",
    "test:e2e:trace": "nx run e2e:test:trace",
    "test:e2e:show-trace": "nx run e2e:test:show-trace",

    "lint:all": "nx run-many --target=lint --all",
    "lint:e2e": "nx lint e2e",
    "typecheck:all": "nx run-many --target=typecheck --all",
    "typecheck:e2e": "nx typecheck e2e",

    "barrels:all": "nx run-many --target=barrels --all",
    "barrels:contracts": "nx barrels contracts",
    "barrels:media-core": "nx barrels media-core",
    "barrels:infrastructure": "nx barrels infrastructure",
    "barrels:notifications": "nx barrels notifications",
    "barrels:heic-converter": "nx barrels heic-converter",

    "schema-gen:api": "nx schema-gen api",
    "codegen:contracts": "nx codegen contracts",
    "codegen:web": "nx codegen web",
    "codegen:ioc:api": "nx run api:gen:container",
    "codegen:ioc:worker": "nx run media-worker:gen:container",
    "codegen:all": "nx run-many --target=codegen --all",

    "clean:all": "nx run-many --target=clean --all",
    "clean:dist": "nx reset && nx run-many --target=clean --all",

    "check:deps": "syncpack lint",
    "check:policy": "tsx scripts/validate-policy.ts",
    "format": "prettier --write .",
    "format:check": "prettier --check .",

    "db:migrate": "nx run api:db:migrate",
    "db:seed": "nx run api:db:seed",
    "db:make": "nx run api:db:make",

    "docker:build:api": "docker build -f infra/docker/Dockerfile --target runtime-node --build-arg APP_NAME=api -t photoapp-api .",
    "docker:build:worker": "docker build -f infra/docker/Dockerfile --target runtime-node --build-arg APP_NAME=media-worker -t photoapp-worker .",
    "docker:build:web": "docker build -f infra/docker/Dockerfile --target runtime-web --build-arg APP_NAME=web -t photoapp-web .",
  },
}
```

Notes:

- Every script is one line. Every script either calls `nx <target> <project>`, `nx run <project>:<variant-target>`, or `nx run-many --target=<target> ...`. **No shell composition.**
- `test:all` and `test:ci` exclude test-runner packages via `--exclude=tag:scope:test-runner`. Any future cross-cutting command that _runs_ something (not just lints/typechecks) must also consider this exclusion.
- Variant targets with `:` in the name require `nx run <project>:<target>`, not `nx <target> <project>` (§5.3).
- Old shell mega-scripts (`dance`, `nuke`, `nuke:lite`) and old workspace-delegating scripts (`gen:all`, `gen:gql`, `gen:enums`, `gen:ioc` using `;` and `&&` and `--workspace=`) are removed and replaced by the targets above.
- **`db:rollback` and `db:reset` are intentionally NOT in the canonical scripts.** Rollbacks aren't part of the regular workflow; if a developer needs to roll back during dev work, they invoke knex directly. The canonical scripts cover forward operations (`db:migrate`, `db:seed`, `db:make`).

The list is long because there are a lot of legitimate operations. Length isn't the cost; _inconsistency_ is the cost. Every script follows the same naming and the same one-line structure, so it's scannable and predictable.

---

## 12. Adding a new shared library package

1. Create the folder under the appropriate group (`packages/context/<name>/` or `packages/foundation/<name>/`).
2. Create `package.json` following §3 template (`name`, `main`, `exports`, `scripts`).
3. Create `tsconfig.json` following §4 template (including `baseUrl: "."`).
4. Create `project.json` with targets: `clean`, `barrels`, `build` (`dependsOn: ["clean", "barrels", "^build"]`), `test`, `lint`, `dev`. Add `codegen` if applicable.
5. Create `src/index.ts` as the entry.
6. Add barrelsby config (`barrelsby.json`), scoped to plain re-export directories only (§8.2).
7. From the repo root: `npm install` (registers the workspace).
8. Add per-package root scripts: `build:<name>`, `test:<name>`, `barrels:<name>`, `dev:<name>`.
9. Declare the dependency in any consumer's `package.json`: `"@packages/newname": "*"`.
10. Done. No Dockerfile change, no Vite config change, no tsconfig path additions.

---

## 13. Adding a new app

1. Create `apps/<name>/` with `package.json`, `tsconfig.json`, `project.json`, and `src/`.
2. Declare dependencies on shared packages with `"*"`.
3. Configure Vite (or whichever bundler) per §7 — bundle workspace packages.
4. Add per-app root scripts: `build:<name>`, `dev:<name>`, `test:<name>`, `docker:build:<name>`.
5. Deploy with `npm run docker:build:<name>` — no Dockerfile changes needed.

---

## 14. Validation

A `scripts/validate-policy.ts` script (invoked via `npm run check:policy`) verifies the repo against this policy:

- Every shared library package's `package.json` `main`/`types`/`exports` points at `dist/`.
- Every `build` script is a thin `nx build <name>` alias (no shell composition).
- Every `build` script builds the correct package (catches `media-core → contracts` copy-paste class).
- Every shared package has `tsconfig.json` extending `tsconfig.base.json` and outputting to `dist/`.
- Every shared package's tsconfig has `baseUrl: "."`.
- Every shared package has `project.json` with required targets.
- No app imports package source via relative path (grep for `from '../../../packages/'`).
- No app `tsconfig.json` has `paths` mapping `@packages/*` to source.
- All internal deps use `"*"` (no pinned `"0.1.0"` strings, no `"workspace:*"`).
- All library packages have barrelsby configuration.
- All barrels are up-to-date (run `barrels:all` and check for diffs).
- `syncpack lint` (via `npm run check:deps`) finds no external dep version drift.
- ESLint reports no `===`/`!==` against smart enum instances.
- Generated code paths are in `.gitignore` (schema, smart enums, IoC manifests).
- No Dockerfile at the repo root.
- Test-runner packages have `scope:test-runner` tag and no `main`/`exports`/`build`.
- Cross-cutting test scripts include `--exclude=tag:scope:test-runner`.
- Apps under `apps/` have `scope:apps` in `project.json` tags; library packages (except test-runners) have `scope:packages`.
- Apps extending a tsconfig that defines `paths` explicitly set `compilerOptions.paths` to `{}` (and `baseUrl: "."`) so `@packages/*` resolves via workspace symlinks to `dist/`, not inherited source paths.

The validator also checks ESLint config for a smart-enum reference-equality rule (§0.1). Until that rule exists, it reports a **warning only** (not a CI failure).

This script runs in CI. Policy violations fail the build. **This is how the policy stays enforced over time** — humans drift, CI doesn't.

---

## 15. Summary: the seven things that matter

If you forget everything else, remember these:

1. **`.equals()` on smart enums.** Never `===`. Lint enforces.
2. **`"*"` for internal deps.** Not `"0.1.0"`, not `"workspace:*"`. Lockfile committed. CI uses `npm ci`. Syncpack catches external dep drift.
3. **Scripts are thin (`nx <target> <project>`, single line).** Real work in `project.json`. Root is the canonical command surface. Cross-cutting commands exclude `scope:test-runner`.
4. **Every shared library package builds to `dist/`** with the canonical shape. Test-runner packages (§2.1) are the only exception, and the exception is a documented category.
5. **Apps bundle `@packages/*`** into their output. Self-contained artifacts.
6. **Codegen outputs are gitignored; barrels are committed.** The dep graph + freshness checks enforce order; no stale-fallback committed files.
7. **One Dockerfile** in `infra/docker/Dockerfile`, parameterized by app. Invariant to new packages and apps.

Everything else is detail.
