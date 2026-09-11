# Review — media asset ownership move + image derivative changes

Read-only pass. Nothing was edited. Working tree at branch `worker_core_split_out`,
HEAD = `7ba5d62 worker-core split compiling`.

Baseline for "was this already broken?" comes from two sources: the untracked
`SPLIT-AUDIT.md` at repo root (a prior autonomous audit that recorded exact
build/test status at HEAD), and my own runs of the same commands now.

---

## 1. What actually changed

### 1.1 The headline: this diff is mostly the base-class extraction, not the asset move

160 changed paths, `156 files changed, 300 insertions(+), 3183 deletions(-)`.
The overwhelming majority is item 3 from your description — the `Entity` /
`AggregateRoot` extraction and the import churn it caused (`EntityId`/`ActorId`
moving to `@packages/contracts`, ~100 files with a 2–3 line import edit each).
The asset-ownership move is **7 files**.

Your description had the three items in the order 1 → 2 → 3 with item 3 as
"possibly in flight". It is not in flight; it is done, it compiles, and it is
the bulk of the change. Items 1 and 2 are done too. Items listed as one thing —
"stripping worker-core's mediaItem down to what applyProcessingResults needs" —
did happen and is more aggressive than "stripping": see §1.4.

### 1.2 Item 1 — `generateImageDerivatives` rework: **confirmed, as described**

[imageDerivativeGenerator.ts](apps/media-worker/src/tasks/queue/mediaWorkers/imageDerivativeGenerator.ts)

- `ImageDerivatives.replacementOriginal?: GeneratedDerivative` → `original: GeneratedDerivative` + `originalWasReplaced: boolean`.
- New `readOriginalAsDerivative(buffer)` at [imageDerivativeGenerator.ts:81-98](apps/media-worker/src/tasks/queue/mediaWorkers/imageDerivativeGenerator.ts#L81-L98), wrapped in a new `read_original_metadata` stage.

### 1.3 Item 2 — asset creation moved API → worker: **confirmed, and complete**

- [createMediaItemUpload.ts](packages/context/media-core/src/services/writeServices/mediaItem/createMediaItemUpload.ts) — `mediaItem.addAsset(MediaAssetKind.original, mimeType)` removed.
- [finalizeMediaItemUpload.ts](packages/context/media-core/src/services/writeServices/mediaItem/finalizeMediaItemUpload.ts) — `mediaItem.updateAssetWithMetadata({...})` removed. `completeUploadedWithMetadata` retained.
- `packages/context/media-core/src/domain/MediaItem/MediaAsset.ts` **deleted**, and `#assets`, `#removedAssets`, `addAsset`, `updateAssetWithMetadata`, `applyProcessingResults`, `childEntities()` all removed from media-core's `MediaItem`.
- [media-core mediaItemRepository.ts](packages/context/media-core/src/repositories/domainRepositories/mediaItemRepository.ts) no longer reads the `mediaAsset` table.
- worker-core's `applyProcessingResults` now creates all three rows ([worker-core MediaItem.ts:105-134](packages/context/worker-core/src/domain/MediaItem/MediaItem.ts#L105-L134)).

Grep confirms: **zero references to `MediaAsset`, `media_asset`, or asset methods remain in `packages/context/media-core/src` production code.** The only `mediaAsset` table access left in the entire repo is [worker-core mediaItemRepository.ts:47](packages/context/worker-core/src/repositories/domainRepositories/mediaItemRepository.ts#L47).

### 1.4 Item 3 — base-class extraction: **confirmed, and it is a three-way split, not a two-way**

New `packages/foundation/contracts/src/domain/` holds `Entity.ts`, `entityGuard.ts`,
`serializeAggregates.ts`, `stampAudit.ts`; new `contracts/src/types/domain.ts` holds
`EntityId` / `ActorId`. Both barrelled into `@packages/contracts`.

The event machinery did **not** follow it down. It landed in a new intermediate class:
new file [media-core/src/domain/DomainEntity.ts](packages/context/media-core/src/domain/DomainEntity.ts) —
`DomainEntity extends Entity`, adds `_events`, `recordEvent`, `pullEvents`, and
narrows `childEntities()` to `ChildDomainEntities`. media-core's `AggregateRoot`
now extends `DomainEntity`; worker-core's `AggregateRoot` extends bare `Entity`
and has **no events at all**.

worker-core additionally deleted its own `Entity.ts`, `entityGuard.ts`,
`serializeAggregates.ts`, `stampAudit.ts`, and its whole `src/types/` directory
(dropped from `barrelsby.json` and `src/index.ts`).

### 1.5 Not mentioned in your description at all

- **`SPLIT-AUDIT.md`** (untracked, 519 lines) — a prior audit report sitting in the repo root.
- **Seven `worker-core/src/tests/*` files deleted** and the media-core test mock trimmed by 8 lines. Per `SPLIT-AUDIT.md` §1 these are that audit's edits, not this session's. Net effect: **`worker-core` now has zero test suites** — `jest` exits 1 with "no tests found".
- worker-core's `MediaItem` lost far more than "what `applyProcessingResults` needs": `title`, `description`, `mimeType`, `sizeBytes`, `durationSeconds`, `originalFileName` props, plus `updateItemDetails`, `title()`, `description()`, `takenAt()`, `ownerId()`, `status()`, `kind()`, `mimeType()`, `sizeBytes()`, `width()`, `height()`, `completeUploadedWithMetadata()`. Production code compiles, so nothing in `apps/media-worker` needed them — but see §7.

---

## 2. Findings by section

### §1 — Orientation handling — **correct on all three counts**

| Check                                       | Verdict                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Non-HEIC swaps for orientation ≥ 5          | **CORRECT.** [imageDerivativeGenerator.ts:90-95](apps/media-worker/src/tasks/queue/mediaWorkers/imageDerivativeGenerator.ts#L90-L95). `md.orientation != null && md.orientation >= 5` guards the null case; sharp reports orientation 1–8 or undefined.                                                                                           |
| HEIC path does not double-swap              | **CORRECT.** [:136-142](apps/media-worker/src/tasks/queue/mediaWorkers/imageDerivativeGenerator.ts#L136-L142) takes `result.width`/`result.height` straight from the converter with no correction.                                                                                                                                                |
| Nothing else reads dimensions and disagrees | **CORRECT.** `resizeToDerivative` reads `info.width/height` from the post-`.rotate()` output buffer — already oriented, no correction needed and none applied. The only other pipeline read is `extractCaptureTime`, which reads timestamps, not dimensions. `applyProcessingResults` derives `media_item.width/height` from `displayAsset` only. |

Confidence: high. One nit, cosmetic: the two `runStage` labels disagree with reality —
`hasReplacementOriginal` is logged from `originalWasReplaced` at
[runImageStoragePipeline.ts:61](apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/runImageStoragePipeline.ts#L61), which is fine, but the stale name will mislead whoever greps logs next.

### §2 — mimeType correctness — **correct, with one boundary caveat**

- Non-HEIC: `md.format ? \`image/${md.format}\` : 'application/octet-stream'` — derived from actual bytes. Correct.
- HEIC-converted: `DERIVATIVE_MIME` = `'image/jpeg'`, which is what lands in S3. Correct.
- No hardcoded `DERIVATIVE_MIME` remains on the original path — the only two uses are `resizeToDerivative` (correct: it emits JPEG) and the HEIC branch (correct).
- Client-declared mime no longer reaches the asset row at all: `finalizeMediaItemUpload` stopped calling `updateAssetWithMetadata`, so `objectMetadata.mimeType` now only feeds `media_item.mime_type` via `completeUploadedWithMetadata`.

**Caveat (minor, UNCERTAIN impact):** sharp's `format` strings are not always a valid
mime subtype. `jpeg`→`image/jpeg`, `png`→`image/png`, `webp`→`image/webp` are fine;
`heif`→`image/heif` and `svg`→`image/svg` are not the canonical types, and an odd
format (`magick`, `raw`) would produce garbage. In practice HEIC is intercepted
earlier and non-image bytes throw, so the reachable set is probably safe — but this
is string concatenation where a lookup table belongs.

**Second caveat:** for the non-HEIC path the DB now says (e.g.) `image/png` while the
**S3 object's own `Content-Type` header** is still whatever the client declared on the
presigned PUT — nothing rewrites it, because `originalWasReplaced` is false so no
`writeObject` happens. DB and S3 metadata can disagree. Since nothing reads the asset
row (see §4) this is currently inert, but it is a latent inconsistency.

### §3 — The `originalWasReplaced` contract — **correct, both halves**

[runImageStoragePipeline.ts:76-90](apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/runImageStoragePipeline.ts#L76-L90) uploads `derivatives.original.buffer` to `originalKey` **only** inside `if (derivatives.originalWasReplaced)`.
[:121-127](apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/runImageStoragePipeline.ts#L121-L127) builds `originalAsset` from `derivatives.original` **unconditionally**.

That is exactly the contract you specified. Neither failure mode you named is present:
no redundant re-upload of identical bytes, and no HEIC conversion that misses S3.
Confidence: high — the branch is three lines and there is only one call site.

`PipelineResult.originalAsset` was tightened from optional to required
([processNextMediaImageJob.ts:26](apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/processNextMediaImageJob.ts#L26)), so the type system now enforces the "always write the row" half.

### §4 — Asset creation move: completeness and gaps

**Does `apps/api` still reference `MediaAsset`?**
Production code: **no.** The remaining hits are:

- `apps/api/src/graphql/schema/media/mediaAsset.graphql` + its generated echoes — the `MediaAsset` GraphQL type still exists but **no field anywhere in the schema returns it.** It is an orphan type kept alive only by `implements Node`. The `MediaAssetKind` / `MediaAssetStatus` enums are still genuinely used (storage-key building, `mediaAuthMiddleware`).
- `apps/api/src/tests/*` — three test files, plus `resetDb.ts` truncating `media_asset`.
- `buildMediaAssetStorageKey` — a pure string helper, unrelated to the table.

**Does any read path query asset rows for a PROCESSING item? — NO. No read path queries asset rows at all, ever.**

This is the most important thing I found, and it inverts the premise of your question.
Exhaustive grep for `mediaAsset` / `media_asset` across `apps/api/src`,
`apps/web/src`, `packages/context/media-core/src` and `packages/context/worker-core/src`
production code returns **exactly one** table access: worker-core's `mediaItemRepository.getById`.

Every URL is derived from storage layout:

- Presigned/derived URLs: [createDerivedMediaItemUrl.ts](packages/context/media-core/src/application/media/createDerivedMediaItemUrl.ts) — its own doc comment says _"derived from storage layout only — no media_asset table reads."_
- Byte-serving: [mediaAuthMiddleware.ts:55](apps/api/src/middleware/mediaAuthMiddleware.ts#L55) — `buildMediaAssetStorageKey(decision.value, MediaAssetKind.fromKey(variant))`. Authorization comes from `mediaGrantService`, the key from string concatenation. No asset row consulted.
- Album view / item detail: `enrichMediaItems`, `viewerMediaItemReadService`, `albumReadRepository` — none join `media_asset`.

So the PROCESSING window you were worried about is a non-event, and it was already
a non-event before this change. **`media_asset` is now a write-only table.**
Confidence: high (exhaustive grep, plus `nx typecheck` passes for `api`, `media-worker`,
`media-core`, `worker-core` — the only failure is the pre-existing api test error).

Two dead functions fall out of this, both **pre-existing**, neither touched by your diff:

- `resolveMediaAssetUrl` / `resolvePreferredAssetKind` — **zero production callers.** The only referrer is `packages/context/media-core/src/tests/resolveMediaAssetUrl.application.tests.ts`, a test of dead code that passes. It takes an `assets: AssetStatusSource[]` argument that nothing can supply any more.
- `createDerivedMediaItemUrl` — **zero callers**, exported from the barrel only.

**Does the worker create the original's row, or only the two derivatives?**
**All three.** [worker-core MediaItem.ts:105-134](packages/context/worker-core/src/domain/MediaItem/MediaItem.ts#L105-L134) creates `original`, `thumb`, `display`, applies metadata to each, and pushes all three. The "permanently-failed item ends up with zero asset rows" scenario you asked about is real but **has no consequence**, precisely because nothing reads asset rows — the item's own `status = FAILED` is what the UI polls, and `deleteStoredAssetsForMediaItems` iterates `MediaAssetKind.items()` statically rather than reading rows, so cleanup still covers every key.

**Is `updateAssetWithMetadata` still called anywhere?** No — it is _deleted_, from both
packages, not merely orphaned. `addAsset` likewise. One stale caller survives in a test
(§7). Three `ContractError` members are now unreachable from production code:
`AssetNotFound`, `AssetNotPending`, `AssetNotProcessing`.

### §5 — Transactional integrity in the worker's asset writes

**Are all three asset rows written in the same transaction as the status transition? — Yes, structurally.**
[completeJobRow.ts:36-74](apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/completeJobRow.ts#L36-L74) is one `uow.join()` … `uow.complete(true)` block covering `markSucceeded`, the re-read, `applyProcessingResults`, and `mediaItemRepository.save`. The three `MediaAsset` entities ride as `childEntities()` and are written by `persistRecursion` inside the same `uow.db()` transaction. No partial-write window in the code as written.

**…but the transaction that block runs in is already committed. See BUG-1 in §3.** This
is a transactional-integrity finding, and it is the reason I would not sign off on §5.

**Is `applyProcessingResults` still the single entry point? — Yes.** Only one caller
([completeJobRow.ts:62](apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/completeJobRow.ts#L62)), and asset construction is entirely inside the aggregate.

**Does anything write asset rows outside the aggregate root? — No.** `persist` /
`persistRecursion` reaches them only via `childEntities()`. No raw `mediaAsset` insert
or update exists anywhere in production code.

**One new hazard introduced by the move (see BUG-3):** the guard changed from
"reject if a thumbnail-or-display row exists" to `if (this.#assets.length > 0)`
([worker-core MediaItem.ts:101](packages/context/worker-core/src/domain/MediaItem/MediaItem.ts#L101)).

### §6 — Known outstanding bugs: status check

| Bug                                                              | Status                                                             | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| worker-core `UnitOfWork` lost post-commit `reset()`              | **STILL PRESENT — and materially worse than described.**           | See BUG-1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `getPendingUserAuthorizationById` missing → `nx build api` fails | **STILL PRESENT.**                                                 | Verified: `nx run api:typecheck` fails with 2× TS2339 at `src/tests/revokeAndReshare.integration.tests.ts:409,419`. It exists in [worker-core's](packages/context/worker-core/src/repositories/systemRepositories/systemAuthorizationRepository.ts#L8) `SystemAuthorizationRepository` (used by the worker's `albumSharedWithNonUserStrategy`) but was never added to [media-core's](packages/context/media-core/src/repositories/systemRepositories/systemAuthorizationRepository.ts#L7-L10), which is the one `apps/api` resolves.                                                                              |
| Test files type-checked nowhere                                  | **PARTLY WRONG — correct for the packages, false for `apps/api`.** | `media-core` and `worker-core` `tsconfig.json` both `"exclude": [... "src/tests/**"]`, and their `tsconfig.spec.json` cannot even be compiled standalone (`TS6059: rootDir` violation), so ts-jest is effectively transpile-only there — verified empirically: `mediaUploadAndAlbum.application.tests.ts` imports `MediaAssetRecord` from the **deleted** `../domain/MediaItem/MediaAsset` and jest runs it anyway (type-only import, elided). But `apps/api`'s tsconfig **does** include `src/tests/**` — that is the only reason bug #2 is visible at all. Same for `apps/media-worker` (its typecheck passes). |

Confirmation of BUG-1's mechanism, since it is load-bearing: [worker-core unitOfWork.ts:37-49](packages/context/worker-core/src/infrastructure/repositories/unitOfWork.ts#L37-L49) — the rollback branch calls `reset()`, the commit branch does not. media-core's equivalent calls `reset()` at line 60 inside `publishPostCommit()`, invoked at line 92 right after `trx.commit()`. The worker pruned the event bus and the `reset()` went with it. `uow` is `lifetime: 'scoped'` in the generated manifest, and grep finds **no `createScope` / `beginUnitOfWorkScope` / `withUnitOfWork` anywhere in `apps/media-worker` or `worker-core` production code** — so Awilix resolves it once on the root container and every task shares one instance for the life of the process.

### §7 — The failing tests: there are more than two, and the split is 1/3 new, 3/3 pre-existing

Your "everything compiles except two test files" is understated. Actual counts:

| Project               | At HEAD (per `SPLIT-AUDIT.md` §3) | Now (measured)               |
| --------------------- | --------------------------------- | ---------------------------- |
| `media-core`          | 6 suites / 49 tests — **PASS**    | **2 suites / 11 tests FAIL** |
| `worker-core`         | 0 suites (exit 1)                 | 0 suites (exit 1)            |
| `media-worker` (unit) | 3 suites / 5 tests FAIL           | **4 suites / 12 tests FAIL** |
| `api` typecheck       | FAIL (2 errors)                   | FAIL (same 2 errors)         |

**Newly broken by this working tree: 3 suites, 18 tests.**

**A — `media-core/src/tests/mediaUploadAndAlbum.application.tests.ts` — 8 failures — TEST ASSERTS OLD BEHAVIOR, correctly failing.**
`TypeError: Cannot read properties of undefined (reading 'upsert')` at line 48:
`item.childEntities().assets.upsert` — media-core's `MediaItem` no longer overrides
`childEntities()`, so it inherits the base `{}`. The helper `findAssetRecord` and every
assertion built on it are asserting API-creates-the-original, which is exactly what you
removed. Fix: delete `findAssetRecord` and the asset assertions; assert instead that
finalize leaves **no** asset rows and only flips status to PROCESSING. Also delete the
now-lying doc comment at line 172 (_"`applyProcessingResults` rejects as AssetNotProcessing"_)
and the dead `import type { MediaAssetRecord } from '../domain/MediaItem/MediaAsset'` at line 17,
which points at a deleted file.

**B — `media-core/src/tests/albumAndMediaItem.domain.tests.ts` — 3 failures — TEST ASSERTS OLD BEHAVIOR, correctly failing.**
`TypeError: item.applyProcessingResults is not a function`. Correct: `applyProcessingResults`
moved to worker-core. These three cases are genuinely valuable (ready transition,
not-processing rejection, replay rejection) and **currently have no home** — worker-core
has zero test suites. Fix: move them to a new worker-core suite against
`@packages/worker-core`'s `MediaItem`, updated for `originalAsset` being required.

**C — `media-worker/src/tests/processNextMediaImageJob.tests.ts` — 7 failures — MIXED: pre-existing wrong import, newly exposed.**
`item.addAsset is not a function` (×6) and `item.applyProcessingResults is not a function` (×1).
Root cause is **not** the asset move: the test imports `MediaItem`, `MediaItemRepository`,
`UnitOfWork` etc. from **`@packages/media-core`** ([lines 4-12](apps/media-worker/src/tests/processNextMediaImageJob.tests.ts#L4-L12)) while the code under test imports them from `@packages/worker-core`.
That wrong import shipped with the split commit and was silently harmless while both
packages had identical `MediaItem`s. Your change diverged them, so it now bites.
Fix is two-part: repoint the imports at `@packages/worker-core`, **then** replace
`item.addAsset(MediaAssetKind.original, 'image/jpeg')` in the `processingPhoto()` helper
— that method is gone, and the item must now reach PROCESSING with **zero** assets.
`completeUploadedWithMetadata` on line 103 is also gone from worker-core's `MediaItem`,
so the helper needs rewriting, not patching.

**D, E, F — pre-existing, NOT caused by this change** (all three were in `SPLIT-AUDIT.md`'s
"3 suites failing" baseline; I verified each against `git show HEAD`):

- `media-worker/src/tests/mediaDeletionJobRepository.tests.ts` — suite fails to load: `does not provide an export named 'build__MediaDeletionJobRepository'`. Imports from `@packages/media-core`; the repo lives in `worker-core`.
- `media-worker/src/tests/mediaProcessingJobRepository.tests.ts` — `repo.markSucceeded is not a function`. Same wrong package: `git show HEAD:packages/context/media-core/.../mediaProcessingJobRepository.ts` already had only `enqueueIfNoneActive`.
- `media-worker/src/tests/ioc.config.tests.ts` — expects `composedManifests: ['@packages/media-core', …]`, actual is `['@packages/worker-core', …]`. `apps/media-worker/src/ioc.config.ts` is not in this diff.

**Other test files that reference changed types and would fail if type-checked:**

- `media-core/src/tests/mediaUploadAndAlbum.application.tests.ts:17` — imports `MediaAssetRecord` from a **deleted file**. Elided at runtime; a hard error the moment tests are type-checked.
- `apps/api/src/tests/revokeAndReshare.integration.tests.ts:409,419` — already the api build failure, since api _does_ type-check tests.
- `apps/media-worker/src/tests/processNextMediaImageJob.tests.ts` — types imported from the wrong package throughout; typechecks today only because media-core's `MediaItemRepository`/`UnitOfWork` are still structurally compatible. `apps/media-worker:typecheck` currently **passes**, which means its tsconfig is not covering this file the way api's does — worth confirming.
- `apps/media-worker/src/tests/imageDerivativeGenerator.tests.ts` — **passes, and that is the problem.** It asserts only on `display` and `thumbnail`. It has **zero** assertions on `original`, `originalWasReplaced`, or the orientation swap. The three behaviours this review's §1–§3 are about are entirely untested.

### §8 — Base class extraction — **clean on all three constraints**

| Check                                                                                  | Verdict                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does `contracts` pull in `DomainEventKind` / `EventPayload` / the `DomainEvent` union? | **NO — correctly avoided.** `contracts/src/domain/Entity.ts` has no event surface whatsoever. The union stayed in media-core, behind the new `DomainEntity` intermediate class.                                                                                                                       |
| Is the event type a generic parameter?                                                 | **N/A — a better answer was chosen.** Rather than parameterising `Entity<TRecord, TEvent>`, events were pushed _up_ into a media-core-local subclass. `Entity` stays event-free and worker-core's `AggregateRoot` extends it directly with no phantom event machinery. This is the cleaner factoring. |
| New runtime dependency in `contracts`?                                                 | **NO.** `contracts/package.json` `dependencies` unchanged: `@reharik/smart-enum`, `typia`. `serializeAggregates.ts` imports `isSmartEnumItem` from `@reharik/smart-enum` — already a dependency. No Knex, no sharp, no AWS SDK. `Entity` uses only the `crypto` global.                               |

Two minor notes:

- `contracts` now has two things called "domain": `src/domain/` (the Entity module) and `src/types/domain.ts` (`EntityId`/`ActorId`), both flat-exported from the same barrel. No symbol collision today, but the naming will confuse.
- media-core's `DomainEntity.childEntities()` returns `ChildDomainEntities` while the base returns `ChildEntities`. TS accepts it (covariant return), and `AggregateRepo` was correctly widened to `DomainEntity` — but the base's `childEntities()` returning `{}` is what silently produced failure A rather than a compile error.

---

## 3. Bugs found — silent first

### BUG-1 — SILENT-ISH, SEVERE — worker `UnitOfWork` reuses a committed transaction across the whole job

Files: [worker-core unitOfWork.ts:37-49](packages/context/worker-core/src/infrastructure/repositories/unitOfWork.ts#L37-L49), [claimJobRow.ts:105](apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/claimJobRow.ts#L105), [completeJobRow.ts:40](apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/completeJobRow.ts#L40)

**Your §6 description of this bug understates it.** You described the symptom as
"an ERROR logged after every _successful_ commit", self-healed by the loop's
`settle(false)`. That accounts for the boundary _between_ tasks. It misses the
boundary _inside_ one task:

1. `claimJobRow` line 105: `await uow.complete(true)` — commits. `trx` is **not** cleared.
2. `runImageStoragePipeline` runs (S3 + sharp, no DB) — nothing resets anything.
3. `completeJobRow` line 40: `await uow.join()` — sees `trx` still truthy, **returns without opening a new transaction**.
4. Every query in `completeJobRow` — `markSucceeded`, `getById`, `save`, and therefore all three asset inserts — issues against the **already-committed** transaction.

Knex rejects builder use on a completed transaction, so step 4 throws, `completeJobRow`'s
catch calls `uow.settle(false)` and rethrows, `processNextMediaImageJob`'s catch calls
`recordJobFailure` (which gets a fresh trx, because `settle` reset it), and the job is
requeued. On retry the same sequence repeats. **If this analysis holds, image processing
can never complete — every job burns all 3 attempts and terminal-fails.**

Marked **UNCERTAIN on blast radius, CONFIRMED on mechanism.** The four code facts
(no `reset()` after commit; `uow` scoped with no scope ever created; `claimJobRow` commits
on the success path; `completeJobRow` `join()`s afterward) are each verified directly.
What I did not do is run the worker against a live Postgres to watch it fail, and there
are three ways I could be wrong: knex might tolerate the reused handle differently than I
expect; the four early-return branches in `claimJobRow` all `complete(true)` too and might
mask the ordering; or something in `WorkerTask` composition might resolve `uow` per task
in a way the manifest does not show. **This is the single highest-value thing to verify —
run one real image upload end-to-end and watch whether the item reaches READY.**

Fix: move `reset()` to after `await trx.commit()` in `completeTransaction`, matching
[media-core's unitOfWork.ts:90-92](packages/context/media-core/src/infrastructure/repositories/unitOfWork.ts#L90-L92). One line.

### BUG-2 — SILENT — pre-existing items with an API-created original row will terminal-fail

File: [worker-core MediaItem.ts:101-103](packages/context/worker-core/src/domain/MediaItem/MediaItem.ts#L101-L103)

The guard changed from "reject if thumbnail or display exists" to `if (this.#assets.length > 0)`.
Correct for items created after this change (API creates nothing). But **any item already
in flight at deploy time** — uploaded through the old `createMediaItemUpload`, which
inserted an `original` row — arrives at the worker with `#assets.length === 1`, fails
`AssetKindAlreadyExists`, rolls back, requeues, and burns all 3 attempts to a permanent
failure. The user sees an upload that hung and then died.

Silent because it manifests as a normal-looking retry-exhaustion, not a distinctive error.
The unique index `media_asset(media_item_id, kind)` ([0001_init_schema.ts:176](apps/api/db/migrations/0001_init_schema.ts#L176)) would also reject the new original row on a fresh UUID, so there is no way through.

Fix: either a data migration deleting `media_asset` rows for items in PENDING/PROCESSING
before deploy, or make `applyProcessingResults` replace pre-existing rows rather than
reject. Deploy ordering matters — worth deciding deliberately rather than discovering.

### BUG-3 — LOUD — `nx build api` fails

Pre-existing, unchanged, already covered in §6. Two `TS2339`s in
`apps/api/src/tests/revokeAndReshare.integration.tests.ts`. Fix: add
`getPendingUserAuthorizationById` to media-core's `SystemAuthorizationRepository`,
porting the worker-core implementation ([systemAuthorizationRepository.ts:113](packages/context/worker-core/src/repositories/systemRepositories/systemAuthorizationRepository.ts#L113)).

### BUG-4 — LOUD — 18 newly-failing tests across 3 suites

§7 A, B, C. All diagnosed; none indicates a production defect.

### Non-bugs, worth a decision

- `resolveMediaAssetUrl`, `resolvePreferredAssetKind`, `createDerivedMediaItemUrl` — dead, zero production callers, one of them with a passing test. Pre-existing.
- GraphQL `MediaAsset` type — orphan, no field returns it.
- `ContractError.AssetNotFound` / `AssetNotPending` / `AssetNotProcessing` — now unreachable.
- `worker-core/src/tests/testViewerIds.ts` — sole survivor of the deleted test dir, zero consumers.

---

## 4. Gaps — described as done, actually not (or half)

1. **"Everything compiles except two test files."** Three things are wrong here: `nx build api` does not compile (BUG-3, and it predates this work); it is _three_ newly-failing suites (18 tests), not two files; and three _further_ suites were already failing at HEAD. Six failing suites total across the two apps.

2. **"Assets have no presence in the API at all."** True for TypeScript production code. Not yet true for the **GraphQL schema** — the `MediaAsset` type is still declared, still generated into `types.generated.ts` and `apps/web`'s types, and still carries a `url: String!` field that no resolver backs. Finishing the stated goal means deleting `apps/api/src/graphql/schema/media/mediaAsset.graphql`'s type (keeping the two enums) and re-running the codegen chain.

3. **worker-core has zero test coverage of its own code.** `applyProcessingResults` — now the _sole_ writer of every asset row in the system, and the aggregate whose guard BUG-2 turns on — has no test anywhere. The three cases that used to cover it (§7 B) currently fail in the wrong package. `nx test worker-core` exits 1 with "no tests found".

4. **The new derivative behaviour is untested.** `imageDerivativeGenerator.tests.ts` passes without a single assertion on `original`, `originalWasReplaced`, or the orientation swap. The orientation logic is correct as written, but nothing will tell you if it regresses. A fixture with EXIF orientation 6 plus one HEIC fixture would pin §1–§3 completely.

5. **Cross-package test imports are unpoliced.** Four `apps/media-worker` test files import from `@packages/media-core` while testing code that imports `@packages/worker-core`. This is the same class of problem your `api-tests-import-worker-source` note records, now in the other direction, and it is what made the split's damage invisible. No lint rule enforces the boundary.

---

## 5. Questions

1. **Has a single image upload actually completed end-to-end since the worker-core split?** This decides BUG-1's severity — whether it is a noisy log line or a total processing outage. If you have run the e2e suite green since `7ba5d62`, my analysis is wrong somewhere and I would like to know where.

2. **Is there in-flight production data?** i.e. any `media_item` in PENDING/PROCESSING with an existing `media_asset` row. Determines whether BUG-2 needs a migration before deploy or is purely theoretical.

3. **Is `media_asset` meant to stay a write-only table?** Nothing reads it. Either it is deliberate provenance/bookkeeping (fine — but then the `MediaAsset` GraphQL type and `resolveMediaAssetUrl` should go), or something was supposed to read it and does not.

4. **Where should `applyProcessingResults`' tests live** — a new `worker-core/src/tests/` suite (which also fixes the exit-1), or `apps/media-worker`? Related: do you want `--passWithNoTests` on worker-core as a stopgap, or should the suite be written now?

5. **`runImageStoragePipeline(job, actorId)` passes `job.createdBy` as the `ownerId` for the storage base key** ([processNextMediaImageJob.ts:97](apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/processNextMediaImageJob.ts#L97)). Pre-existing, outside this diff, and it holds today because `createMediaItemUpload` sets `ownerId = actorId`. Is that invariant guaranteed to hold, or could a contributor-enqueued job ever produce a key under the wrong owner? I could not settle it from the code.

6. **Was `apps/media-worker`'s tsconfig meant to type-check `src/tests/**`?** `apps/api`'s does (which is the only reason BUG-3 is visible); media-worker's typecheck passes despite `processNextMediaImageJob.tests.ts` importing from the wrong package. If it is excluded, the same class of bug stays invisible there.
