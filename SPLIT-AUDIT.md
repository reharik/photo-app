# Post-split audit — `worker-core` / `media-core`

Autonomous pass. Scope of edits: **tests and test helpers in `worker-core` and `media-core` only.**
No commits made. No production code, IoC config, or `scanDirs` touched.

---

## 0. Headline

Three things you should read even if you read nothing else:

1. **The entire `worker-core/src/tests/` directory was dead.** Not one file in it tested
   `worker-core`. Two suites failed to run; the other four _passed while testing
   `media-core`_ — they import `@packages/media-core` directly. I deleted 7 of the 8 files.
2. **`nx build api` currently fails**, at `api:typecheck`. This contradicts the prompt's
   "Everything currently builds." It is pre-existing, not caused by this pass. See §2.
3. **Test files are not type-checked anywhere in this repo.** Both `tsconfig.json`s exclude
   `src/tests/**`, and `ts-jest` runs transpile-only. This is _the_ reason the split's damage
   to tests was invisible. Verified empirically (§4.2).

---

## 1. What I changed

8 files. 7 deletions, 1 edit. All in `src/tests/`.

### Deleted — `packages/context/worker-core/src/tests/` (pass 2a)

| File                                       | Why                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mediaUploadAndAlbum.application.tests.ts` | ORPHANED. Imports 6 pruned `services/writeServices/**` modules. Suite **failed to run** at baseline.                                                         |
| `reorderAlbumItems.domain.tests.ts`        | ORPHANED. Imports pruned `domain/Album/AlbumItem`, `domain/Album/albumItemOrder`, `domain/utilities/reorderAlbumItems`. Suite **failed to run** at baseline. |

### Deleted — `packages/context/worker-core/src/tests/` (pass 2b)

All four were **byte-identical** to the `media-core` copy (verified with `cmp` immediately
before deletion — zero diverged, so nothing was skipped). Each tests a symbol that exists
**only in `media-core`**, imported via `@packages/media-core`. No relocation was needed:
`media-core` already holds an identical, green copy of each.

| File                                        | Symbol under test                          | Present in worker-core?       |
| ------------------------------------------- | ------------------------------------------ | ----------------------------- |
| `albumAndMediaItem.domain.tests.ts`         | `Album`, `ALBUM_ITEM_ORDER_*`              | No — `domain/Album/**` pruned |
| `collectionPaging.application.tests.ts`     | `build__ViewerAlbumReadService`            | No — all read services pruned |
| `getOrCreateAllUsers.tests.ts`              | `getOrCreateAllUsers` (inviteUsersService) | No — pruned                   |
| `resolveMediaAssetUrl.application.tests.ts` | `resolveMediaAssetUrl`                     | No — pruned                   |

### Deleted — `packages/context/worker-core/src/tests/` (pass 2d)

| File                         | Why                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `writeServiceTestHarness.ts` | Dead helper. Imports 6 modules that no longer exist; could not be loaded at all. Zero remaining referrers after 2a/2b. |

### Edited (pass 2c)

| File                                                                             | Change                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/context/media-core/src/tests/mediaUploadAndAlbum.application.tests.ts` | Removed 8 lines: 4 dead properties (`claimNextAvailableJob`, `markSucceeded`, `markFailed`, `markPendingRetry`) from each of the two `MediaProcessingJobRepository` mock factories. Those methods moved to `worker-core`; `media-core`'s contract now has only `enqueueIfNoneActive`. The mocks were stubbing a surface the real contract no longer has. Test count unchanged, still green. |

### Deliberately KEPT

| File                                                      | Why                                                                                                                                                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/context/worker-core/src/tests/testViewerIds.ts` | Ambiguous — see §5.6. It is a plausible shared test utility, but currently has zero consumers in the package. Per your instruction I kept it and am reporting it. It does not match `testMatch`, so it has no effect on the test run either way. |

---

## 2. What broke and what I reverted

**Nothing was reverted.** Every pass built and tested cleanly in the sense of "no regression I
caused". Two things need flagging honestly:

### 2.1 `nx test worker-core` now exits non-zero — and this is a decision for you

After the deletions, `worker-core` has **zero test suites**, so jest exits 1:

```
testMatch: **/src/tests/**/*.tests.ts - 0 matches
Run with `--passWithNoTests` to exit with code 0
```

Your instructions said both _"revert a pass if tests break"_ and _"when uncertain, report
instead of acting."_ **These conflict here, so I am saying so plainly rather than working
around it.** I did not revert, for two reasons:

- Reverting would restore four suites that test **`media-core`'s** code from inside
  `worker-core` — the single most misleading thing the audit found. That would defeat the
  purpose of the pass.
- The baseline was already red (2 suites failing to run). This is not a regression from
  green; it is a change in _failure mode_, from "broken tests" to "no tests".

The one-line fix is `--passWithNoTests` in `worker-core`'s `project.json` test target. **I did
not apply it** — it is build config, outside "tests and test helpers only", and you may
prefer the better answer: write real `worker-core` tests instead of papering over an empty
suite. `worker-core` currently has **zero** coverage of its own code.

### 2.2 `nx build api` fails — pre-existing, not mine

```
src/tests/revokeAndReshare.integration.tests.ts(409,64): error TS2339:
  Property 'getPendingUserAuthorizationById' does not exist on type 'SystemAuthorizationRepository'.
src/tests/revokeAndReshare.integration.tests.ts(419,45): error TS2339: (same)
```

Attribution is conclusive: that file is untouched by this session (`git status` clean for it),
and my only `media-core` edit is inside `src/tests/`, which `apps/api`'s tsconfig does not
include. Details and recommendation in §5.5 — **this is the most consequential finding in the
audit** and I did not act on it.

---

## 3. Build and test status

### Baseline (before any edit)

| Project        | Build                                | Tests                                                                                  |
| -------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| `media-core`   | PASS                                 | **PASS** — 6 suites, 49 tests                                                          |
| `worker-core`  | PASS                                 | **FAIL** — 2 suites failed to run, 4 passed, 27 tests                                  |
| `media-worker` | PASS                                 | **FAIL** — 3 suites failed, 5 tests failed, 69 passed (74 total, integration excluded) |
| `api`          | **FAIL** (`api:typecheck`, 2 errors) | not run (build gate)                                                                   |

### After each pass

| Pass                        | Build | Tests                                                                 |
| --------------------------- | ----- | --------------------------------------------------------------------- |
| **2a** orphaned deleted     | PASS  | `worker-core` **4 passed / 27 tests — green**; `media-core` unchanged |
| **2b** duplicates deleted   | PASS  | `media-core` 6/49 PASS; `worker-core` 0 suites → exit 1 (§2.1)        |
| **2c** stale mocks trimmed  | PASS  | `media-core` **6 suites / 49 tests PASS**                             |
| **2d** dead harness deleted | PASS  | `media-core` 6/49 PASS; `worker-core` 0 suites → exit 1               |

### Final

| Project        | Build                                                            | Tests                                                                |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| `media-core`   | PASS                                                             | **PASS** — 6 suites, 49 tests                                        |
| `worker-core`  | PASS                                                             | **exit 1: no tests found** (§2.1)                                    |
| `media-worker` | PASS                                                             | **FAIL — 3 suites / 5 tests, identical to baseline. No regression.** |
| `api`          | **FAIL** (`api:typecheck`) — identical to baseline, pre-existing |

Nx caching note: `nx test worker-core` returned a **stale cached pass** after the deletions.
All figures above are from `--skip-nx-cache` runs.

---

## 4. Findings by section

### 4.1 Test classification

**`media-core` — all 6 suites + 2 helpers: KEEP.** Every relative import resolves; every symbol
under test still exists in the package; all 49 tests pass. One hollow detail inside an
otherwise-live suite, fixed in 2c (§4.2).

**`worker-core` — all 6 suites + 2 helpers: dead.** Nothing in the directory tested
`worker-core`. Import-resolution audit of the test tree:

```
OK      ../application/media/MediaStorage          MISSING ../domain/Album/Album
OK      ../domain/MediaItem/MediaItem              MISSING ../domain/Album/AlbumItem
OK      ../domain/MediaItem/MediaAsset             MISSING ../domain/Album/albumItemOrder
OK      ../repositories/domainRepositories/        MISSING ../domain/utilities/reorderAlbumItems
          mediaItemRepository                      MISSING ../repositories/domainRepositories/albumRepository
OK      ../repositories/mediaProcessingJob/        MISSING ../repositories/domainRepositories/userRepository
          mediaProcessingJobRepository             MISSING ../repositories/readRepositories/types
OK      ../infrastructure/repositories/unitOfWork  MISSING ../services/readServices/types
OK      ../types/types                             MISSING ../services/writeServices/**  (7 modules)
```

| File                                        | Bucket               | Note                             |
| ------------------------------------------- | -------------------- | -------------------------------- |
| `mediaUploadAndAlbum.application.tests.ts`  | ORPHANED             | failed to run                    |
| `reorderAlbumItems.domain.tests.ts`         | ORPHANED             | failed to run                    |
| `albumAndMediaItem.domain.tests.ts`         | DUPLICATED + hollow  | identical copy; tests media-core |
| `collectionPaging.application.tests.ts`     | DUPLICATED + hollow  | identical copy; tests media-core |
| `getOrCreateAllUsers.tests.ts`              | DUPLICATED + hollow  | identical copy; tests media-core |
| `resolveMediaAssetUrl.application.tests.ts` | DUPLICATED + hollow  | identical copy; tests media-core |
| `writeServiceTestHarness.ts`                | ORPHANED helper      | imports 6 pruned modules         |
| `testViewerIds.ts`                          | test-only, ambiguous | KEPT — §5.6                      |

**DUPLICATED divergence check: none.** All 8 files were byte-identical to their `media-core`
counterparts (`cmp` clean, and a full-tree diff modulo the package-name substitution produced
0 changed lines). So there is **no** implementation-divergence finding hiding in the test
duplicates — the copies were never edited after the duplication. Confidence: high.

**MISPLACED: none within these two packages** — but see §5.5 for a genuinely misplaced test in
`apps/api`.

### 4.2 Tests that pass but no longer mean anything

**The umbrella cause — test files have zero type safety.** Both packages' `tsconfig.json`
exclude `src/tests/**`, so `nx typecheck` / `nx build` never see them. `ts-jest` is
transpile-only here, so jest does not catch types either. Verified with a probe file
containing `const alsoBad: number = 'definitely not a number'` — **the suite passed.** (Probe
removed.) `apps/media-worker` excludes tests the same way. `apps/api` is the **only** project
that type-checks its tests, which is exactly why it is the only place the compiler caught
prune fallout (§5.5). Confidence: high, empirically demonstrated.

**Finding A — four `worker-core` suites green while testing another package.** The most
valuable item in this section. They pass, CI is happy, and they imply `worker-core` has 27
tests of coverage. It has none. They resolve `@packages/media-core` through the workspace
symlink — note `worker-core/package.json` does **not** declare `@packages/media-core` as a
dependency (§5.6), so this edge is invisible to the Nx graph too. _Acted on (2b)._

**Finding B — `getOrCreateAllUsers.tests.ts` had dangling type imports.** It imported
`UserRepository` and `CreateUserWriteService` from pruned paths. Both were `import type`, so
they were erased at runtime and the suite passed against `media-core`'s implementation while
its own type imports pointed at nothing. _Acted on (2b)._

**Finding C — stale mock surface in `media-core`.** Two `MediaProcessingJobRepository` mock
factories declared `claimNextAvailableJob` / `markSucceeded` / `markFailed` /
`markPendingRetry`. Those methods now live only in `worker-core`; `media-core`'s contract has
only `enqueueIfNoneActive`. The mocks promised a claim-side API the package no longer has, and
nothing flagged it because tests aren't type-checked. _Acted on (2c)._

### 4.3 Test-only survivors

**None, in either package.** I ran a reachability walk from each package's production roots
(`src/index.ts`, `src/ioc.config.ts`, `src/generated/ioc-manifest.ts`) and separately from all
test files:

```
worker-core:  46 ts files | prod-reachable 37 | test-reachable 43 | test-only survivors: NONE
media-core:  172 ts files | prod-reachable 164 | test-reachable 166 | test-only survivors: NONE
```

Every non-test file the tests reached was already reachable from production. The only file
unreachable from both is `worker-core/src/generated/ioc-registry.types.ts`, which is generated
and consumed externally via the `./iocTypes` package export — not a survivor.

This is a clean result and slightly surprising given the prune was consumer-driven: no helper
survived purely on the strength of its own test. Confidence: high.

### 4.4 IoC / scoping consequences

**Report only — no changes made, as instructed.**

**`scanDirs`** — both are `'src'`, both exist and contain factories. Neither scans an empty
tree. But the prune left **two empty directories**:

- `packages/context/media-core/src/repositories/mediaDeletionJob/` — completely empty
- `packages/context/worker-core/src/application/support/` — completely empty

Harmless to discovery; they are just litter. Not deleted (not test files).

**Registered-but-unresolvable: none.** `ioc validate` in `apps/media-worker` (the only place
cross-manifest validation runs) reports **"Validation passed: no issues found."**

**Resolvable-but-unregistered: none.** Same source. Note the worker registers with
`{ strict: false }` in `container.ts`, so a missing key would surface at resolve time rather
than registration time — but validation is clean, so there is nothing pending.

**Scoped lifetimes in `worker-core` — your belief is correct, and the consequence is concrete.**

`worker-core`'s `ioc.config.ts` still carries `lifetimeMarkers: { RequestScopeLifeCycle: 'scoped' }`
inherited from the `media-core` copy. 12 of its 13 registrations extend that marker and are
therefore **scoped**; only `mediaStorage` is a singleton:

| Registration                        | Lifetime  | Genuinely resolved in a scope at runtime? |
| ----------------------------------- | --------- | ----------------------------------------- |
| `uow` (`UnitOfWork`)                | scoped    | **No**                                    |
| `persist`                           | scoped    | **No**                                    |
| `mediaItemRepository`               | scoped    | **No**                                    |
| `emailDeliveryRepository`           | scoped    | **No**                                    |
| `mediaDeletionJobRepository`        | scoped    | **No**                                    |
| `mediaProcessingJobRepository`      | scoped    | **No**                                    |
| `systemAlbumRepository`             | scoped    | **No**                                    |
| `systemAsyncNotificationRepository` | scoped    | **No**                                    |
| `systemAuthorizationRepository`     | scoped    | **No**                                    |
| `systemCommentRepository`           | scoped    | **No**                                    |
| `systemMediaItemRepository`         | scoped    | **No**                                    |
| `systemUserRepository`              | scoped    | **No**                                    |
| `mediaStorage`                      | singleton | n/a                                       |

**`apps/media-worker` never creates a scope.** There is no `createScope`, no
`beginUnitOfWorkScope`, no `withUnitOfWork` anywhere in it — `container.ts` builds a root
container and every task takes `uow` as an ordinary injected dep.

I verified what Awilix 13.0.5 does with a SCOPED registration resolved from the **root**
container:

```
root resolve twice -> same instance?  true
two child scopes   -> distinct?       true
```

**So all 12 scoped registrations are de facto process-wide singletons.** "Scoped" is currently
decorative in `worker-core`: it is not exercised, and it works only because nothing creates a
scope. If a scope is ever introduced, twelve registrations silently change identity semantics
at once. Whether `worker-core` should stop scoping is your call — I have not made it.

**`scopeProvided` — invisible-to-analyzer, keep separate from real problems.**

- `worker-core`: **none declared.** Correctly so — no factory in the package takes `viewerId`
  or `publicLinkId` as a dependency. (Both identifiers appear only as ordinary function
  parameters in `stampAudit.ts` and `withLiveAuthorizationFilter.ts`, never in a Deps object.)
- `media-core`: `['viewerId', 'publicLinkId']`. These are injected per-scope at request time
  and are **invisible to the static analyzer by design** — a known `ioc-manifest` gap, not a
  usage error. Nothing to chase.

Note `CLAUDE.md` documents `scopeProvided: ['viewerId', 'publicLinkId', 'uow']`. The actual
config lists only the first two; `uow` became a real registration (renamed via
`registrations.UnitOfWork.unitOfWork.name = 'uow'`). **`CLAUDE.md` is stale on this point.**

**A note that contradicts `CLAUDE.md`, in both packages.** `CLAUDE.md`'s repository taxonomy
says System repositories are **singleton** with a raw `database` handle. In reality they are
**scoped and take `uow`** — in `media-core` (8 of 10 scoped) as well as `worker-core` (all 6).
This is **pre-existing in `media-core`, not created by the split**, and I mention it only so
you do not read the `worker-core` table above as split damage. Confidence: high.

### 4.5 Divergence between the two copies

31 files exist in both packages (`media-core` 162 non-generated/non-test files; `worker-core`
36). **13 identical, 18 diverged.** 5 files are `worker-core`-only.

Most divergence is mechanical (barrels shrinking, imports dropping). The substantive ones:

**Clean, intentional divergence — complementary halves of one table.** These are not drift;
they are a deliberate write-side / claim-side split, and they are the answer to "which concepts
are now maintained in two places":

| Concept                                          | `media-core` half                                      | `worker-core` half                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `mediaProcessingJob` table                       | `enqueueIfNoneActive` (write path)                     | `claimNextAvailableJob`, `markSucceeded`, `markFailed`, `markPendingRetry`, `releaseStalledJobs`              |
| `async_notification` table                       | `upsertRecipientRow`                                   | `claimNotificationBatch`, `claimIndividualNotifications`, `deleteCompletedRecords`, `bumpRecordAttemptsByIds` |
| `access_grant` / `SystemAuthorizationRepository` | `getAuthorizationsByAlbumId`, `getAuthorizationsByIds` | `getPendingUserAuthorizationById`                                                                             |

**The table schemas and their status/column vocabulary are now maintained in two places.** A
migration touching `mediaProcessingJob` or `async_notification` has to be reflected in both
packages, and nothing enforces that. (No extraction proposed, per your constraint.)

**Domain-event machinery stripped from `worker-core` — verified behaviourally safe.**
`Entity.recordEvent`/`pullEvents`, `AggregateRoot.flushEvents`, `uow.collectEvents`, and the
whole `domainEvents/` tree are gone from `worker-core`. I checked whether that silently drops
events the worker used to emit: `media-core`'s `MediaItem` contains exactly **one**
`recordEvent` call, `reactionAdded`, on a reactions path that `worker-core` does not have at
all. `worker-core`'s `MediaItem` has zero. **Nothing is lost.** Confidence: high.

**`MediaItem.ts` (129 changed lines)** — `worker-core`'s copy drops tags, reactions,
`#computedReactionCounts`, and the reaction/tag child-entity collections. Consistent with the
prune. It also carries a **~20-line commented-out `markReadyAfterDerivatives` block**
(`domain/MediaItem/MediaItem.ts` ~L284–304) left behind by the prune — dead comment, worth
deleting when you next touch the file.

**`types/types.ts`** — `worker-core` dropped `CollectionInfo` and `PageInfo`. Correct: no
paging in the worker.

**`readServiceBaseType.ts` is now misnamed in `worker-core`.** It no longer contains any read
service base type — `ReadServiceBase`, `PublicReadServiceBase`, and `AgnosticReadServiceBase`
were all pruned. It holds only `RequestScopeLifeCycle`, the lifetime marker that drives all 12
scoped registrations. Load-bearing file, misleading name.

**Identical files (13)** — `MediaStorage.ts`, `MediaAsset.ts`, `entityGuard.ts`,
`serializeAggregates.ts`, `stampAudit.ts`, `withAlbumItemCount.ts`,
`withLiveAuthorizationFilter.ts`, `systemMediaItemRepository.ts`, `systemUserRepository.ts`,
`types/index.ts`, and 3 barrels. These are the true two-places-maintained files with no
divergence yet.

### 4.6 Fallout the compiler cannot see

**Barrels: clean.** Every `export ... from './x'` in every `index.ts` in both packages resolves
to a real file. Checked all barrels in both trees; zero broken re-exports.

**Migrations / seeds: clean.** Nothing under `apps/api/db/` imports from either package.

**String-name references: clean.** `composedManifests` in `apps/media-worker/src/ioc.config.ts`
lists `@packages/worker-core`, `@packages/infrastructure`, `@packages/notifications` — all
resolve. Raw-SQL physical table names are correct per the `knex-stringcase` rule (e.g.
`createJobQueueRepository` passes `attemptCountColumn: 'attempt_count'`, `'access_grant'` in
raw joins). `ioc validate` passing covers the registration-name surface.

**`package.json`: clean, with one gap.** No `files` or `sideEffects` fields in either package.
All three `exports` subpaths (`.`, `./iocManifest`, `./iocTypes`) point at files that exist,
and both correctly list `development` (src) before `types` (dist).

- **Gap:** `packages/context/worker-core/package.json` does **not** declare
  `@packages/media-core`, yet (until this pass) its tests imported it. Now resolved by
  deletion — no undeclared dependency remains. Flagging it because the same shape recurs in
  `apps/media-worker` (§5.5).

**Dead type export:** `ReleaseStalledJobsResult` is still exported from
`media-core/src/repositories/mediaProcessingJob/mediaProcessingJobRepository.ts` (L34), but
`releaseStalledJobs` itself moved to `worker-core`. Orphan type. Production file — not touched.

**Two tracked junk artifacts at repo root:** `output.json` (82 KB) and
`output-worker-graph.json` (103 KB), both dated Sep 6 during the split, both **committed**.
They look like Nx graph dumps from debugging. Probably want deleting + gitignoring.

---

## 5. Left for you to decide

### 5.1 `worker-core` has zero tests — and zero coverage of its own code

Highest-value item. The package now has no suites. The real fix is not `--passWithNoTests`;
it is that `createJobQueueRepository`, `mediaDeletionJobRepository`, the
`claimNextAvailableJob` / `markPendingRetry` / `releaseStalledJobs` logic, and
`systemAsyncNotificationRepository`'s claim methods are **untested in the package that owns
them** — while `apps/media-worker` has tests for exactly those things pointed at the wrong
package (§5.5). Related: the `nx test worker-core` exit code, §2.1.

### 5.2 `worker-core`'s UnitOfWork loses its post-commit `reset()` — a real production bug

`worker-core/src/infrastructure/repositories/unitOfWork.ts`. In `media-core`, the success path
of `completeTransaction` calls `publishPostCommit()`, which calls `reset()`. The prune removed
the event bus **and the `reset()` along with it**, replacing it with nothing:

```ts
// worker-core — completeTransaction
if (!ok || shouldRollback) { await trx.rollback(); ...; reset(); return; }
await trx.commit();
logger.debug(`[uow:${id}] committed`);
// <-- no reset(): trx stays pointing at the committed, dead transaction
```

Because the uow is a **process-wide instance** (§4.4), after the first successful commit
`join()` sees a truthy `trx` and does not open a new one, and `db()` hands back a committed
handle.

In practice it is masked, not fatal: `runMediaWorkerLoop` calls `uow.settle(false)` after
**every** task in both loops and in both the success and catch paths. `settle` sees the stale
`trx`, attempts `rollback()` on an already-committed transaction, that throws, `settle` catches
it and calls `reset()`. So it self-heals — at the cost of a
`logger.warn('settle resolving an open transaction')` **plus a
`logger.error('settle failed to resolve the transaction')` after every successful task
commit.** Your worker error log is being poisoned on the happy path.

It stops being cosmetic the moment anything calls `join()`/`db()` between `complete(true)` and
the next `settle` — that path gets a dead transaction. Production code; I did not touch it.
The fix is a one-line `reset()` after the commit. Confidence: high.

### 5.3 Should `worker-core` stop declaring scoped lifetimes?

Explicitly yours (§4.4). All 12 scoped registrations behave as singletons today. Two coherent
directions: drop `RequestScopeLifeCycle` from `worker-core` and let them be honest singletons,
or introduce a per-job scope in the worker loop so "scoped" means per-job. The second is more
work but would give each job its own `uow` and would also make §5.2 moot.

### 5.4 Empty dirs, dead code, junk files

- `media-core/src/repositories/mediaDeletionJob/` — empty, delete
- `worker-core/src/application/support/` — empty, delete
- `worker-core/src/domain/MediaItem/MediaItem.ts` ~L284–304 — commented-out
  `markReadyAfterDerivatives`
- `media-core` — dead `ReleaseStalledJobsResult` export
- `worker-core/src/services/readServices/readServiceBaseType.ts` — misnamed (§4.5)
- `output.json`, `output-worker-graph.json` — tracked junk at repo root

### 5.5 `apps/media-worker` tests still point at `@packages/media-core` — 3 red suites, and one security test stranded in `apps/api`

**I did not touch these.** They are a third package, and the `apps/api` one would require
touching two packages at once, which you forbade. But this is where the split's remaining
damage is concentrated.

`apps/media-worker/package.json` no longer declares `@packages/media-core`, and its production
code correctly imports `@packages/worker-core` — but **9 of its test files still import
`@packages/media-core`**, resolving through the workspace symlink. Three suites fail:

| Suite                                   | Failure                                           | Cause                                                                                                                                                                                      |
| --------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mediaProcessingJobRepository.tests.ts` | `repo.markSucceeded is not a function` (×4 tests) | Imports `build__MediaProcessingJobRepository` from `media-core` — which still exists, but is now the **enqueue-only half**. The test silently binds to the wrong package's implementation. |
| `mediaDeletionJobRepository.tests.ts`   | suite failed to run                               | `build__MediaDeletionJobRepository` no longer exists in `media-core` at all; it lives only in `worker-core`.                                                                               |
| `ioc.config.tests.ts`                   | assertion drift                                   | Asserts on the worker's own `ioc.config` shape, which gained `groups` and `discovery.includes`. Unrelated to the two cores.                                                                |

The first two are fixed by changing `@packages/media-core` → `@packages/worker-core` in those
test imports. Full list of the 9 files importing `media-core`:
`ioc.config.tests.ts`, `processNextMediaDeletionJob.tests.ts`, `processNextMediaImageJob.tests.ts`,
`buildMediaStorage.tests.ts`, `mediaDeletionJobRepository.tests.ts`,
`stalledMediaJobSweep.integration.tests.ts`, `mediaProcessingJobRepository.tests.ts`,
`runMediaWorkerLoop.tests.ts`, `logMediaWorkerStartup.tests.ts`.

**And the one that breaks the build — a genuinely MISPLACED, security-relevant test:**

`apps/api/src/tests/revokeAndReshare.integration.tests.ts` (§2.2) asserts that _a revoked
pending grant is invisible to `getPendingUserAuthorizationById`, so the sweep can never put a
dead invite token in an email._ That method was pruned from `media-core` — correctly, since no
`apps/api` production code uses it. It survives in **`worker-core`**, and its only production
consumer is
`apps/media-worker/.../fastSweepNotificationStrategies/albumSharedWithNonUserStrategy.ts:37`.

So the test guards **worker-core** behaviour, exercised only by the **media-worker** consumer,
but lives in `apps/api` and resolves `media-core`'s container. It belongs in `apps/media-worker`.
Note `apps/api` is the only project that type-checks its tests, which is the sole reason this
surfaced as a build failure rather than silent rot. Two options: move the test to
`apps/media-worker`, or delete the `getPendingUserAuthorizationById` assertions from it and
re-establish that coverage in the worker. **Do not simply delete it** — it is the only thing
pinning "revoked invite tokens never get emailed."

### 5.6 `worker-core/src/tests/testViewerIds.ts` — kept, your call

13 lines of ID constants. Zero consumers now. `apps/api` and `apps/media-worker` each maintain
their **own** deliberately-duplicated copy (there is an explicit comment saying so), so this
one has no cross-package role. Delete it, or keep it as the seed for §5.1. Kept because it is
ambiguous and you said to report those.

### 5.7 Restore test type-checking

The single change that would have prevented all of the above: drop `src/tests/**` from the
`exclude` in `media-core`/`worker-core`/`media-worker` `tsconfig.json` (as `apps/api` already
does), or enable `ts-jest` diagnostics. Be warned it will surface a backlog — `apps/api` has
2 such errors today and it is the only project currently paying the cost.

---

## 6. Anything that did not fit

- **Prompt assumption corrected:** "Everything currently builds" is not true — `nx build api`
  fails at `api:typecheck` (§2.2). Pre-existing. It is plausible this was missed because Nx
  cached a pass from before the `SystemAuthorizationRepository` prune, or because only the two
  packages were built directly.
- **Nx cache produced a stale green** for `worker-core:test` after I deleted every suite. Worth
  knowing when you verify this diff: use `--skip-nx-cache` for the test targets.
- **The rename pass was thorough in production code but never ran over tests.** `worker-core`'s
  test files still said `@packages/media-core` throughout, and its
  `systemAsyncNotificationRepository.ts` comment _was_ correctly reworded to say "worker-core
  must…". That asymmetry is a precise fingerprint of the split: comments and prod imports
  rewritten, `src/tests/**` skipped entirely — which is consistent with tests being excluded
  from every tsconfig.
- **No shared package created, no extraction performed, no IoC config or `scanDirs` changed, no
  production code touched, no commit made.**
