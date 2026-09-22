# CLAUDE.md

Conventions and gotchas for this repo. Rules and incantations that aren't obvious
from reading one file. Read the code for the _what_; this file is the _why_ and
the _don't-trip-over-this_.

Nested files: [`apps/media-worker/CLAUDE.md`](apps/media-worker/CLAUDE.md)
(task-runner / QueueClaimable / no-viewer tier),
[`apps/web/CLAUDE.md`](apps/web/CLAUDE.md) (theme tokens / FE GraphQL).

---

## Stack & layout

Nx monorepo, Knex/Postgres. Two-tier packages.

| Dir                                  | package name               | role                                                  |
| ------------------------------------ | -------------------------- | ----------------------------------------------------- |
| `apps/api`                           | `@app/api`                 | GraphQL API                                           |
| `apps/media-worker`                  | `@app/media-worker`        | generic background task-runner (see nested CLAUDE.md) |
| `apps/web`                           | `@app/web`                 | React/Vite frontend                                   |
| `packages/context/media-core`        | `@packages/media-core`     | core bounded context (domain, repos, UoW)             |
| `packages/context/worker-core`       | `@packages/worker-core`    | worker's repos, UoW, job queue (all singletons)       |
| `packages/context/notifications`     | `@packages/notifications`  | notifications context                                 |
| `packages/context/heic-converter`    | `@packages/heic-converter` | HEIC conversion                                       |
| `packages/foundation/contracts`      | `@packages/contracts`      | smart-enums, error types (codegen target)             |
| `packages/foundation/infrastructure` | `@packages/infrastructure` | shared primitives                                     |

`packages/context/*` = app-specific bounded contexts. `packages/foundation/*` =
primitives. **DDD primitives (`Entity`, `AggregateRoot`) live in `media-core`, NOT
in foundation** — foundation only has contracts/infrastructure/logger/utilities.

Nx tags are two-axis: `layer:{app,context,foundation}` + `scope:{apps,packages,...}`.
Batch targets use them: `build:apps` = `tag:scope:apps`, `build:packages` =
`tag:scope:packages`. **Gotcha:** `media-core` and `worker-core` carry `scope:media`
but NOT `scope:packages`, so they are excluded from `tag:scope:packages` batch targets.

---

## IoC (the `ioc-manifest` package)

Build-time codegen DI over an Awilix PROXY container. Package: `ioc-manifest` v2.3.5
(the `ioc-manifest-0.1.0.tgz` at repo root is a stale tarball — ignore it). Policy
lives in one `ioc.config.ts` per project (`defineIocConfig`). CLI binary: `ioc`
(`generate` / `inspect` / `validate`).

### `build__` is the discovery mechanism

A factory is discovered **only** if it's an exported `const`/function whose name
starts with `build__`. Discovery is an AST + type-checker pass
(`discovery.factoryPrefix: 'build__'` in every `ioc.config.ts`):

```ts
// packages/context/worker-core/src/repositories/mediaProcessingJob/mediaProcessingJobRepository.ts
export const build__MediaProcessingJobRepository = (
  { uow }: MediaProcessingJobRepositoryDeps,
): MediaProcessingJobRepository => { ... }
```

- **Impl name** = the suffix with first char lowercased: `build__MediaProcessingJobRepository`
  → registration key `mediaProcessingJobRepository`.
- **The explicit return-type annotation IS the contract.** It must be a named type
  that is imported/declared in that file, or discovery silently drops the factory
  (skip reasons: `CONTRACT_NOT_IMPORTED`, `CONTRACT_NOT_RESOLVED`, etc.). Don't
  return anonymous object literals or unions.
- **Deps** are the single destructured param object; keys = other registration keys.
- **No `build__` prefix = invisible to the container.** This is used deliberately —
  type-only modules and hand-composed helpers (e.g. `WorkerTask`, `QueueClaimable`)
  carry a comment saying they're intentionally not `build__` so they're never
  registered.

### Lifetimes are set at REGISTRATION, not resolution

Lifetime is baked into the generated manifest. Resolution precedence:

1. explicit `registrations[Contract][impl].lifetime` in `ioc.config.ts`
2. a **lifetime-marker** base interface on the return type
3. **default = `singleton`** — anything unmarked is a singleton.

Lifetime markers (nominal "brand" interfaces; extend one and you get its lifetime):

- `RequestScopeLifeCycle` → `scoped` (defined in `@packages/infrastructure`,
  `requestScopeLifeCycle.ts`). In media-core the `UnitOfWork`, every domain, read and
  system repo, and the request-scoped read/write services extend it.
- `WorkerJobProcessorBase` is **not** a lifetime marker any more — the worker declares
  no `lifetimeMarkers`, so it's a nominal brand only. Everything in the worker and
  worker-core (repos, services, `uow`) is a singleton; see the nested CLAUDE.md.

No `ioc.config.ts` currently sets an explicit `lifetime`. media-core's config only
renames the UoW's registration key (`unitOfWork: { name: 'uow' }`); its lifetime comes
from the marker like everything else.

### The freeze bug (dominant bug class)

A **singleton that depends on a scoped/transient dep freezes it** — captures the
first-resolved instance and reuses it across all scopes forever.

- **scoped → singleton: fine** (depending on a longer-lived dep).
- **singleton → scoped: BUILD ERROR.** Codegen's lifetime-inversion check fails the
  build: _"A singleton freezes its scoped dependency at first construction."_
- singleton → transient: warning only.

Escape hatch (not currently used in this repo): `allowLifetimeInversion: true` or
an array of dep keys. The configs avoid inversions structurally instead — `uow` and
every repo that queries through it are scoped, as are the services that use them;
config, knex and the few raw-`database` repos are singletons. Nothing singleton
consumes a scoped repo. Keep it that way.

### Groups

Groups collect contracts by base type; **members keep their own lifetimes** (a group
is not a lifetime mechanism). In media-core's `ioc.config.ts`:

- `writeServices` (`WriteServiceBase`, scoped), `readServices` (`ReadServiceBase`,
  scoped), `publicReadServices` (scoped) — request-scoped.
- `agnosticReadServices` (`AgnosticReadServiceBase`) — **singleton**, deliberately
  does NOT extend `RequestScopeLifeCycle`.
- `domainEventHandlers` (collection).
- `workerTasks` (collection, worker only — see nested CLAUDE.md).

`scopeProvided: ['viewerId', 'publicLinkId']` — values injected per-scope at
request time (treated as scoped by the inversion checker). `uow` is no longer among
them: it is an ordinary scoped registration, one per scope.

**The `default` registration.** When a contract (interface) has more than one
implementation, exactly one must be marked `default: true` so a plain injection of
that contract knows which to use. This also applies to an interface that exists
_only_ to group — it's never injected individually, but it still needs a default, so
one member is chosen arbitrarily (e.g. the worker's `WorkerTask`, see nested CLAUDE.md).

### Gen commands — run after adding/renaming/moving/deleting a `build__` factory or editing `ioc.config.ts`

Generated files (`ioc-manifest.ts`, `ioc-registry.types.ts`, `ioc-composed.ts`) are
**not** committed — `.gitignore` excludes `**/generated/`, `**/di/**` and
`apps/api/src/di/`. They are rebuilt from source everywhere they are needed: by
the gen commands below locally, by the `Generate IoC manifests` step in every CI
job, and inside the Docker image build (api's `build:vite` dependsOn `gen-ioc`,
which is why the image builds correctly from a bare checkout). They carry a DO
NOT EDIT banner — change the `build__` factory or `ioc.config.ts` and
regenerate; never hand-edit the output.

- `npm run gen:ioc:api` / `:worker` / `:worker-core` / `:media-core` / `:infrastructure` / `:notifications`
  → `nx gen-ioc <proj>` → `ioc generate`.
- `npm run gen:ioc:all` → every project (after broad changes).
- `npm run gen:api` → `nx gen-gql api && nx gen-ioc api` (GraphQL + IoC together).

Diagnostics (read-only, never write):

Run these from **inside the project directory** (e.g. `packages/context/media-core`,
`apps/api`), where `ioc` finds that project's `ioc.config.ts`:

- `npx ioc inspect --discovery` — re-runs discovery from **source**; use to debug why
  a factory isn't picked up (prints skip reasons).
- `npx ioc inspect` — prints the **generated manifest** on disk (lifetimes, groups).

**Gotcha: most projects emit to `src/generated/`, but the API is a deliberate
exception** — it uses `apps/api/src/di/generated/` (its `ioc.config.ts` sets
`generatedDir: 'src/di/generated'`). This divergence is intentional; don't "fix" it.

---

## Smart-enums (`@reharik/smart-enum`)

### The pattern

```ts
import { enumeration, type Enumeration } from '@reharik/smart-enum';
const input = ['shareInvite', 'albumShared', 'mediaAdded'] as const;
export type NotificationKindEnum = Enumeration<typeof NotificationKindEnum>;
export const NotificationKindEnum = enumeration<typeof input>('NotificationKind', { input });
```

Members are camelCase keys. **Wire value = `constantCase(key)` automatically**:
member `.itemAdded` → `.value === 'ITEM_ADDED'`, `.display === 'Item Added'`. So
the GraphQL schema's `SCREAMING_SNAKE` value round-trips to the same wire string.

GraphQL-boundary enums use `serializeAs: 'value'` so JSON yields just the wire
string (not a wrapped object). `main.ts` in apps sets `setDefaultSerializationMode('value')`.

### Flow: GraphQL enum → contracts → codegen

The GraphQL schema is the source of truth. The
`@reharik/graphql-codegen-smart-enum-preset` (`mode: enums`) reads the API's
generated `schema.graphql` and emits one `enumeration(...)` per schema enum into the
**auto-generated** `packages/foundation/contracts/src/enums/graphqlSmartEnums.ts`
(DO NOT EDIT). Server (`apps/api/codegen.yml`) and client (`apps/web/codegen.yml`)
codegen import enums from `@packages/contracts` — the preset derives `enumValues`
for you; no manual upkeep.

**Hand-authored enums** (`Operation`, `AlbumMemberRole`, `ReactionEmoji`,
`ErrorCategory`) are in `codegen.yml`'s `skipEnums` + `externalEnums` — they're
written by hand in `packages/foundation/contracts/src/enums/*.ts` and re-exported
from the barrel, not generated.

### Adding/changing an enum value — end to end

Schema-driven enum:

1. Edit the GraphQL SDL under `apps/api/src/graphql/schema/**` (use SCREAMING_SNAKE).
2. `npm run gen:gql:api` — regenerates the API `schema.graphql` snapshot + types.
3. `npm run gen:enums` — regenerates `graphqlSmartEnums.ts` from that snapshot.
4. `npm run gen:gql:web` — regenerates web types against the new schema.

Hand-authored enum: edit **both** the GraphQL SDL enum (keep wire values in sync)
**and** the hand-authored file in `contracts/src/enums/`, ensure it's barrel-exported
(`nx barrels contracts` if you added a file), then run the gen steps.

---

## Repository taxonomy — classify by behaviour, not folder

**The default for every repo is: scoped, queries through `uow.db()`.** Domain, read,
system and job-queue repos all extend `RequestScopeLifeCycle` and take `uow`, so they
run inside the scope's transaction. What separates them is what they do and whether
they're viewer-gated — not their db handle. Classify by behaviour; **the folder name
can lie** (the job-queue repo lives in `mediaProcessingJob/`, not any of the three).

| Kind                     | Folder                | Naming                | Lifetime | DB handle  | Viewer-gated                        |
| ------------------------ | --------------------- | --------------------- | -------- | ---------- | ----------------------------------- |
| Domain/aggregate (write) | `domainRepositories/` | `<Agg>Repository`     | scoped   | `uow.db()` | No                                  |
| Read                     | `readRepositories/`   | `<X>ReadRepository`   | scoped   | `uow.db()` | **Yes** (`viewerId` + queryHelpers) |
| Job queue                | `mediaProcessingJob/` | `<X>JobRepository`    | scoped   | `uow.db()` | No (`actorId` for audit only)       |
| System (quarantined)     | `systemRepositories/` | `System<X>Repository` | scoped   | `uow.db()` | **No, by design**                   |

- **`uow.db()` needs an open transaction** — it throws `Transaction not started`
  otherwise. In the API every GraphQL operation opens one (see UoW lifecycle below),
  so read repos are safe there; code outside a GraphQL scope must open one itself
  (`uow.inTransaction(fn)`) or use a raw-`database` repo.
- **Domain repos** are the write path: persist aggregates via
  `persist(aggregate, uow)` in `AggregateRepo.ts` (which drains domain events into the
  UoW). Access control happens in services _above_ them, not here.
- **Read repos** are viewer-gated: methods take `viewerId` (usually as an argument;
  `MediaAssetReadRepository` injects it) and apply an access filter via
  `.modify(withViewableByMemberOrAlbumGrant(uow.db(), viewerId))` etc. Method names
  encode the gate (`getAlbumForViewer`, `...ForShareLink`). The public-link read repos
  (`PublicAccessReadRepository`, `PublicMediaItemReadRepository`) gate on the link
  instead of a viewer.
- **Job-queue repos** (`MediaProcessingJobRepository`): no aggregate, no viewer. In
  the worker, claims go through `createJobQueueRepository` (worker-core) — a plain,
  non-`build__` factory that does `FOR UPDATE SKIP LOCKED` on `uow.db()`, so the
  claim lives in whatever transaction the caller opened.
- **System repos** (`System*` prefix = quarantine marker): un-gated, for processes
  with **no current viewer** (worker sweeps, post-commit handlers). Same tables as
  read repos but no access predicate — e.g. worker-core's
  `SystemAlbumRepository.getAlbumTitlesById` vs the gated
  `AlbumReadRepository.getAlbumForViewer`. Use these only from viewer-less paths.

**Exceptions — singletons on raw `database` Knex** (autocommit, no UoW). These exist
for consumers that run outside any request scope and are singletons themselves:
`TokenAccessReadRepository` (used by the singleton `tokenAccessReadService`),
`SystemMediaGrantRepository` (API `mediaGrantService`) and
`SystemEmailVerificationRepository` (API `authService`). Don't add to this list for
code that runs inside a GraphQL scope — use the scoped `uow` repos there.

**The worker is different:** it builds one root container and never a child scope,
so everything there — worker-core repos and its `uow` included — is a singleton. See
[`apps/media-worker/CLAUDE.md`](apps/media-worker/CLAUDE.md).

---

## Query fragments (`.modify()`)

Reusable Knex query-builder pieces in
`packages/context/media-core/src/repositories/queryHelpers/`. A fragment is a
**factory `withX(db, ...)` returning a `(qb) => void`** that you attach with
`.modify(...)`:

```ts
uow
  .db()('album')
  .modify(withAttachViewerMembership(uow.db(), viewerId))
  .modify(withAlbumCoverItem) // some are the modifier directly (no deps)
  .modify(withCollectionInfo(uow.db(), collectionInfo)) // standard pagination fragment
  .select(...albumFields);
```

Convention: **bundle join + select together** in one fragment (e.g.
`withAlbumCoverItem` does the `leftJoin` AND selects the shared
`mediaItemSelectColumns`). `withCollectionInfo` is the canonical pagination fragment
(window `totalCount` + limit/offset/order + stable `.id` tiebreaker).

**Access-control fragments are the security-critical reusable ones** — change these
with care:

- `withActiveGrants` / `withLiveAuthorizationFilter` (both in
  `withLiveAuthorizationFilter.ts`) — the live filter is `revokedAt` null and not
  expired; `withActiveGrants` adds "granted to the viewer". Composable with table
  aliases.
- `withViewableByMemberOrAlbumGrant` — the viewability gate: row is visible if the
  viewer is an album member OR an active album-scoped grant exists.
- `withActivePublicLink` — the public/unauthenticated path (share-link token).

---

## DDD / Unit of Work / events

- **Aggregates** (`media-core/src/domain/`): `Entity<TRecord>` and
  `AggregateRoot extends Entity`. Domain methods call `recordEvent(...)`, buffering
  events on the entity. `flushEvents()` recursively pulls events from the root and
  child entities but **skips foreign aggregate roots** (not ours to drain).
- **UoW** (media-core `src/infrastructure/repositories/unitOfWork.ts`): manual Knex
  transaction. `start()` opens the trx; `db()` returns it and **throws if none is
  open** (all repo reads and writes go through it); `collectEvents()` buffers;
  `inTransaction(fn)` is start + commit/rollback around `fn`; `complete(ok)` settles
  (rolls back if `!ok` or `flagRollbackOnly()` was called) and on commit does
  **commit-THEN-publish**:
  ```ts
  await t.commit();
  await publishPostCommit(); // handlers run AFTER commit, in a second transaction
  ```
- **Event publishing is lossy / best-effort.** Post-commit handlers run in a fresh
  transaction on the same uow; if any handler throws, that transaction rolls back and
  the error is **logged and swallowed** — no outbox, no retry, the events are lost.
  Intentional. Don't put must-not-lose work in a domain event handler.
- Events are drained at **persist time**: `persist(aggregate, uow)` writes the row
  tree then `uow.collectEvents(aggregate.flushEvents())`; they only fire on commit.
- **UoW lifecycle** is scope-scoped: `uow` is an ordinary scoped registration, one per
  child scope. The API opens a scope per GraphQL operation in `useScopedContainer.ts`
  through the generated `open*Scope` factories; the scope roots in
  `apps/api/src/graphql/context/requestContextFactories.ts` wire `start`/`finalize` to
  `uow.start`/`uow.complete`. **Every operation runs in a transaction:**
  - mutations (`AuthenticatedWriteGraphQLContext`): `writeServices` + `readServices`,
    committed iff no GraphQL errors and nothing called `flagFailure`;
  - queries (`AuthenticatedReadGraphQLContext`) and public reads
    (`PublicRequestContext`): `readServices` / `publicReadServices`, always
    `finalize(false)` → **rolled back**, since reads have nothing to commit.

  (`withUnitOfWork` / `beginUnitOfWorkScope` are gone; only a historical note in
  media-core's `ioc.config.ts` still mentions them.)

### Column naming: snake_case DB ↔ camelCase code

Handled by **`knex-stringcase`** in `apps/api/src/knexfile.ts` (and the worker's).
`wrapIdentifier` camelCase→snake_case on writes; `postProcessResponse`
snake_case→camelCase on reads. So write `.where({ albumId })` against an `album_id`
column. The app hook chains `convertNullsToUndefined` then
`smartEnumPostProcessResponse` (revives smart-enum columns).

**Gotcha:** raw SQL / explicit string table names bypass identifier wrapping — those
must use the **physical** snake_case name (e.g. `trx.raw('?? + 1', ['attempt_count'])`,
`'access_grant'` in a raw join).

---

## Codegen chain — ORDER MATTERS

Four stages, source → final FE types. The Nx `dependsOn` graph wires these, but the
manual order is:

1. `npm run gen:gql:api` — API types + the canonical **`apps/api/src/graphql/generated/schema.graphql`** AST snapshot. (Must use `schema-ast` print, not `printSchema()`, to preserve enum-value directives.)
2. `npm run gen:enums` — contracts smart-enums from that snapshot.
3. `nx sync-schema web` — **copies** the API snapshot to `apps/web/src/graphql/generated/schema.graphql` (web does NOT read the API schema directly). Auto-runs as a dep of step 4.
4. `npm run gen:gql:web` — web operation types + Apollo type-policies from the synced snapshot.

`npm run gen:gql:all` runs api+web and lets Nx pull in `sync-schema` + `contracts:build`
automatically. IoC codegen (`gen:ioc:*`) is independent of this chain.

---

## Migrations

Knex/Postgres, migrations in `apps/api/db/migrations/`, seeds in `apps/api/db/seeds/`.

- **Naming: `NNNN_name.ts`, sequential 4-digit zero-padded** (e.g.
  `0013_unseen_activity_nulls_not_distinct.ts`).
- `npm run db:make` → `nx run api:db:make` → knex `migrate:make`. **Gotcha:** knex's
  default output is a timestamp prefix and there's no known auto-numbering wrapper, so
  the new file must end up named `NNNN_name.ts` with the next ordinal — match the
  convention regardless of what the command produces.
- `npm run db:migrate` (`migrate:latest`), `npm run db:seed` (`seed:run`).
