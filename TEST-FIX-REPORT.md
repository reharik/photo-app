# Test fix + coverage report

Follow-on to `ASSET-MOVE-REVIEW.md`. Working tree on `worker_core_split_out`.
Nothing committed. **No production code was changed** — the only edits outside
`src/tests/**` were temporary mutations used to verify that new tests actually
fail, each reverted and verified byte-for-byte (see §6).

Packages are spelled out in full throughout: `media-core` is
`packages/context/media-core`, `worker-core` is `packages/context/worker-core`.

---

## 1. Fixed

### 1.1 The wrong-package import — it was 9 files, not 1

`processNextMediaImageJob.tests.ts` was the instance you named, but the sweep
found the same class of error in **every media-worker test file that imports a
package at all**. `apps/media-worker` production code imports
`@packages/media-core` **zero** times, and does not even declare it as a
dependency — yet eight test files imported from it.

They resolved through the workspace symlink to media-core's built `dist/`, so
they were silently testing a different package's code from the one the app runs.

| File | Was | Now |
| --- | --- | --- |
| `processNextMediaImageJob.tests.ts` | `@packages/media-core` | `@packages/worker-core` |
| `mediaDeletionJobRepository.tests.ts` | `@packages/media-core` | `@packages/worker-core` |
| `mediaProcessingJobRepository.tests.ts` | `@packages/media-core` | `@packages/worker-core` |
| `buildMediaStorage.tests.ts` | `@packages/media-core` | `@packages/worker-core` |
| `processNextMediaDeletionJob.tests.ts` | `@packages/media-core` | `@packages/worker-core` |
| `runMediaWorkerLoop.tests.ts` | `@packages/media-core` | `@packages/worker-core` |
| `logMediaWorkerStartup.tests.ts` | `@packages/media-core` | `@packages/worker-core` |
| `stalledMediaJobSweep.integration.tests.ts` | `@packages/media-core` | `@packages/worker-core` |

Five of those eight were passing at HEAD purely because the two packages were
still structurally compatible. They were latent, not harmless.

A **ninth** instance is the api typecheck failure — same class, different
mechanism (a test resolving worker code off the api's container rather than an
import statement). See 1.4.

A full sweep in both directions now shows **zero** cross-package test imports:
no media-core test imports worker-core, no worker-core test imports media-core,
no media-worker source imports media-core, and no api/notifications/e2e code
imports worker-core. The only remaining textual references are prose in comments
explaining where a moved test went.

Beyond repointing, `processNextMediaImageJob.tests.ts` needed real rework,
because worker-core's `MediaItem` is a much smaller class:

- `processingPhoto()` used `addAsset()` + `completeUploadedWithMetadata()`, both
  gone. It now **rehydrates** an item into PROCESSING carrying **zero** assets —
  which is exactly how the worker finds one now that the API creates none.
- `pipelineResult()` gained the now-required `originalAsset`.
- `item.status()` / `width()` / `height()` are gone; assertions moved to
  `item.toPersistence()`, i.e. the record that actually reaches the DB.
- `createJobRepo()` dropped `enqueueIfNoneActive` — not on worker-core's
  repository, correctly (see 1.3).

### 1.2 Tests asserting old behavior (media-core)

**A — `mediaUploadAndAlbum.application.tests.ts` (8 failures)**

- *Old*: `findAssetRecord(item, MediaAssetKind.original)?.status` was
  `MediaAssetStatus.pending` after `createMediaUpload`, and
  `MediaAssetStatus.ready` after finalize. That asserted the API creates and
  then readies the original's asset row.
- *New*: both assert `childAssetRows(item)` is `[]` — the API creates **no**
  asset rows at any point.
- *Why correct*: asset creation moved to the worker, and worker-core's
  `applyProcessingResults` now rejects any item that arrives with
  `#assets.length > 0`. An API-created row would terminal-fail every upload, so
  "no rows" is the behavior that must hold. The new assertion is also the one
  that would catch a regression putting the API back in the asset business.
- Also removed: the dead `import type { MediaAssetRecord } from
  '../domain/MediaItem/MediaAsset'` (that file is deleted — elided at runtime,
  a hard error the day tests get type-checked), five vestigial
  `findAssetRecord` guards that only gated a storage key derived from the
  storage layout, and the doc comment claiming `applyProcessingResults` rejects
  with `AssetNotProcessing`.
- The five `applyProcessingResults` calls were being used only to drag an item
  to READY so album-add would accept it. media-core cannot perform that
  transition any more. Since `ensureMediaItemInReadyState` reads the status off
  the **read projection**, not the aggregate, those sites now publish a ready
  projection (`readyProjection`). That is honest about where the transition
  comes from — another context — instead of faking it on the aggregate.

**B — `albumAndMediaItem.domain.tests.ts` (3 failures)**

Not rewritten — **moved**. These three (ready transition, not-processing
rejection, replay rejection) are genuinely valuable and were failing only
because `applyProcessingResults` moved to worker-core. They now live in
`packages/context/worker-core/src/tests/mediaItem.domain.tests.ts`, run against
the aggregate that implements them, with `originalAsset` supplied. A pointer
comment was left at the old site.

Nothing in either suite looked like it was asserting something that should
still be true, so nothing was flagged for you here.

### 1.3 The three suites already red at HEAD — all one root cause

All three were the **same wrong-package error** as 1.1, and all three were
test-side and small.

| Suite | Diagnosis | Fix |
| --- | --- | --- |
| `mediaDeletionJobRepository.tests.ts` | `build__MediaDeletionJobRepository` exists **only** in worker-core; media-core has no such export, so the suite failed to load and its 5 tests never ran | repointed the import |
| `mediaProcessingJobRepository.tests.ts` | media-core's repository has only `enqueueIfNoneActive`; `markSucceeded` etc. are worker-core's | repointed the import |
| `ioc.config.tests.ts` | asserted `composedManifests: ['@packages/media-core', …]`; the worker's actual config says `'@packages/worker-core'` | corrected the expectation to match the config |

One judgment call inside the second: the two `enqueueIfNoneActive` cases could
not stay in `apps/media-worker`, because the worker never enqueues — the API
does, through media-core's copy. Rather than delete that coverage (it pins the
enqueue-before-commit race, a bug that actually shipped), I **relocated** them
to a new `packages/context/media-core/src/tests/mediaProcessingJobRepository.tests.ts`.

---

## 2. Added

### 2.1 `imageDerivativeGenerator.tests.ts` — 1 test → 12

Fixtures are generated with `sharp().withMetadata({ orientation })`; no binaries
committed. The HEIC converter is mocked at the module boundary. Every
orientation case asserts the **aspect-ratio relationship** between the original
and the display derivative, not just literal numbers.

| Test | Invariant |
| --- | --- |
| no EXIF orientation | dimensions unswapped, and the original's aspect agrees with the display derivative's |
| orientation 1 | same, with an explicit EXIF tag present rather than absent |
| orientation 6 | axes swapped — the common phone-portrait case; original and display agree |
| orientation 8 | axes swapped; original agrees with **both** display and thumbnail |
| orientation 5 | axes swapped — a transposing mirror, not just the quarter-turns |
| non-HEIC `originalWasReplaced` | false, and `original.buffer` is *identically* the input buffer (not a copy) |
| non-HEIC mimeType | derived from `metadata().format` — a PNG reports `image/png`, never the derivative's `image/jpeg` |
| HEIC `originalWasReplaced` | true, and `original.buffer` is the converted bytes |
| HEIC mimeType | `image/jpeg`, since that is what lands in S3 |
| HEIC dimensions | taken from the converter **verbatim** — the orientation swap must not be applied twice |
| HEIC derivatives | built from the converted bytes, not the undecodable HEIC input |
| stage failure | the failing stage is named in the error, so the job log says which step broke |

The HEIC fixture is deliberately adversarial: the converted JPEG carries a
*transposing* EXIF orientation while the converter reports post-decode
dimensions. A regression that applied the non-HEIC swap on that path produces
900×600 instead of 600×900 and is caught.

### 2.2 The `originalWasReplaced` caller contract — new suite, 3 tests

`apps/media-worker/src/tests/runImageStoragePipeline.tests.ts`.

| Test | Invariant |
| --- | --- |
| not replaced | `writeObject` is called for display + thumbnail **only** — never the original key — yet `originalAsset` is still returned from the original's metadata |
| replaced (HEIC) | the converted bytes are written **to the original key** with the JPEG mime, and the returned `originalAsset` agrees with those exact bytes |
| original missing from S3 | stops before generating anything; no derivative written |

The replaced case asserts the write happened *with the converted bytes under the
original's key*, not merely that some write happened — because the failure that
matters is a HEIC conversion that never reaches S3 while the database records
that it did.

### 2.3 The UnitOfWork commit/reset fix — 2 new suites, 17 tests

`packages/context/worker-core/src/tests/unitOfWork.tests.ts` (8) and
`packages/context/media-core/src/tests/unitOfWork.tests.ts` (9). Knex is faked
so each `database.transaction()` hands back a distinct object — "did it open a
new one?" is answered by identity, not by counting side effects.

| Test (both packages) | Invariant |
| --- | --- |
| after `complete(true)` | the next `join()` opens a **new** transaction; the first really was committed |
| after `complete(false)` | the next `join()` opens a new transaction |
| **commit throws** | `trx` is still cleared — this is why the fix uses `finally`; without it the error path reinstates the same dead-handle bug |
| `db()` after settling | throws rather than handing back a stale handle |
| stale `flagRollbackOnly` | does not leak into the next transaction and silently discard its writes |
| `settle` on an abandoned transaction | clears it, so the loop's `settle(false)` really does protect the next task |

worker-core additionally has the one that reproduces the **actual outage**:

> *two sequential jobs through the same process-wide uow* — four phases
> (claim/complete × 2 jobs), four distinct transactions, no handle reused. This
> is the level the failure occurred at: `uow` resolves once on the worker's root
> container, and `claimJobRow` commits before `completeJobRow` joins.

media-core additionally covers the post-commit bus: events publish only **after**
the commit, never on rollback, and **never twice** — a stale event buffer would
replay the first request's events on every later commit in the process.

### 2.4 Asset row creation in the worker — 12 + 3 tests

`packages/context/worker-core/src/tests/mediaItem.domain.tests.ts` (12, includes
the 3 relocated from media-core):

| Test | Invariant |
| --- | --- |
| all three rows created | original + display + thumbnail, in one apply |
| original row provenance | built from the pipeline's **original**, not the display derivative — its own mime, dimensions and byte count |
| every asset READY | a PENDING row would mean bytes that never landed |
| pre-existing asset | refuses with `AssetKindAlreadyExists`, stays PROCESSING, adds no duplicate row (the unique index on `(media_item_id, kind)`) |
| bad display dimensions | rejects, and leaves the item untouched — still PROCESSING, still no assets for a retry to write |
| capture time | adopted when the item had none |
| ready transition / not-processing / replay | the three relocated cases |
| `markProcessingFailed` × 3 | moves to FAILED, is idempotent, and refuses to drag a READY item back |

`processNextMediaImageJob.tests.ts` (+3), where the transaction actually is:

| Test | Invariant |
| --- | --- |
| all three rows written | the aggregate handed to `save` carries all three kinds |
| **same transaction** | the ordered boundary trace is exactly `join → markSucceeded → getById → save → complete(true)`. Any `complete` between the status flip and the save would let a crash strand an item marked ready with missing assets |
| failed job | trace is `join → markSucceeded → getById → complete(false)`; nothing saved, no partial asset state |

---

## 3. Left failing

**Nothing.** The api typecheck failure is fixed — see 1.4 below, which was
diagnosed as a third instance of the same wrong-package problem rather than a
missing method.

### 1.4 `api:typecheck` — the ninth wrong-package test (was BUG-3)

```
src/tests/revokeAndReshare.integration.tests.ts(409,64): error TS2339:
  Property 'getPendingUserAuthorizationById' does not exist on type 'SystemAuthorizationRepository'.
src/tests/revokeAndReshare.integration.tests.ts(419,45): error TS2339: (same)
```

My first pass read this as "media-core is missing a method." That was the wrong
diagnosis. `getPendingUserAuthorizationById` has exactly **one** production
consumer — `apps/media-worker`'s `albumSharedWithNonUserStrategy` — and it
belongs on worker-core's `SystemAuthorizationRepository` only. media-core's copy
deliberately does not declare it. Adding it there would have put a method with
no media-core consumer into media-core purely to satisfy a misplaced test.

It is the same error as the other eight: a test exercising worker code through
the wrong package's container. `apps/api`'s container composes media-core, so
`container.resolve('systemAuthorizationRepository')` there is media-core's.

**Fixed by moving the test, not by touching production code.** Scenario C left
`apps/api/src/tests/revokeAndReshare.integration.tests.ts` for a new
`apps/media-worker/src/tests/pendingAuthorizationLookup.integration.tests.ts`,
whose container composes worker-core. This follows the precedent already set in
that same suite: scenario D moved to media-worker for exactly this reason, and
its header documented it. Scenario C's header entry was rewritten as a pointer
in the same style.

The arrange changed from driving GraphQL mutations to direct inserts, matching
the sibling `fastSweepOrphanedAuthorization.integration.tests.ts` — that the
api's share and revoke mutations write these rows is pinned on the api side by
scenario B; this suite's subject is what the lookup does once they exist.

Both original assertions carried over intact (live invite resolves with its
token; revoked invite returns undefined **while the row survives** — the second
half matters, since "returns undefined" alone would also pass if the row had
been hard-deleted). I added two cases while in the method, both previously
uncovered — drop them if you disagree:

- an **expired** invite also returns undefined (the live filter is
  `revoked_at IS NULL` *and* not-expired; only the revoked half was covered)
- an id belonging to a **USER**-kind grant throws rather than returning a row
  the caller would mail as an invite — a USER grant has no `linkToken`, so
  quietly returning it would put `undefined` in the invite URL

`nx run api:typecheck` now passes, which also unblocks `nx build api`.

### No production bugs found

Every failure I fixed was test-side. In particular I checked the two behaviours
most likely to hide one, by mutation (see §6): the orientation swap and the
`originalWasReplaced` upload branch are both correct as written.

Two things worth a decision, neither a failure:

- **BUG-2 from the review is now pinned by a test, not fixed.** The
  "pre-existing asset" case in the worker-core suite documents that an item
  which arrives carrying an asset row is *rejected* — correct for new items,
  and a terminal failure for anything uploaded through the old API and still in
  flight at deploy time. The test asserts current behavior. If you decide that
  path should instead replace pre-existing rows, that test is the one to change.
- **`resolveMediaAssetUrl.application.tests.ts` passes and tests dead code.**
  Zero production callers; its `assets: AssetStatusSource[]` argument is now
  unsuppliable. Left alone — deleting it is a call about the dead code, not
  about the tests.

---

## 4. Could not cover

Nothing was blocked. Every seam I needed already existed: the derivative
generator takes a buffer and reaches its converter through a dynamic import
(mockable at the module boundary), `runImageStoragePipeline` and `completeJobRow`
take their collaborators by injection, and both `build__UnitOfWork` factories
take `database` as a dependency. No production restructuring was needed to make
anything testable.

Two things I deliberately did **not** do, per your constraints:

- No `--passWithNoTests` added to worker-core. It now has 2 real suites / 20
  tests, so the zero-suite exit-1 resolved itself. (Note: `apps/media-worker`'s
  test target already carried `--passWithNoTests` before this work; untouched.)
- No tsconfig or jest config changes, and no runtime type assertions added to
  work around the fact that test files are type-checked nowhere. Where a type
  error would have been the natural signal, I asserted on observable output
  instead — `toPersistence()` records and boundary traces, not private state.

---

## 5. Final state

All commands run with `--skip-nx-cache`.

| Package | At HEAD (per review) | Now |
| --- | --- | --- |
| `media-core` | 6 suites / 49 tests, **2 suites / 11 tests FAILING** | **8 suites / 57 tests — all pass** |
| `worker-core` | 0 suites, exit 1 ("no tests found") | **2 suites / 20 tests — all pass** |
| `media-worker` | 14 suites / 74 tests, **4 suites / 12 tests FAILING** | **15 suites / 94 tests — all pass** |
| `api:typecheck` | **FAIL (2 errors)** | **pass** — see 1.4 |
| `media-worker:typecheck` | pass | pass |
| lint (api + all three packages) | — | pass (4 warnings, all pre-existing production files) |

Net: 6 failing suites → 0. Test count 123 → 171 (+48), of which +35 are new
coverage and +5 are tests that existed but never ran because their suite failed
to load.

media-worker's `test` target also runs three `node --test` EXIF suites; those
were passing before and still are.

**Not run: integration suites, including the one I moved in 1.4.**
`*.integration.tests.ts` needs a live Postgres on 5443. Your running stack
(`homeroll-scratch-*`) does not publish that port, and I could not start a
throwaway container — `docker run` is blocked in this sandbox. I did not touch
your running stack to free the port.

So `pendingAuthorizationLookup.integration.tests.ts` is **written and
type-checked but never executed**. What I could verify:

- it type-checks against **worker-core's** `SystemAuthorizationRepository`, and
  that check is load-bearing: renaming the method to a typo produces
  `TS2551 … Did you mean 'getPendingUserAuthorizationById'?`, i.e. it would have
  caught the original failure
- `api:typecheck` and `media-worker:typecheck` both pass
- the two carried-over assertions and the arrange helpers are ported verbatim
  from code that was passing (scenario C, and the sibling sweep suite)

The two cases I added are the unverified part. Please run
`nx run media-worker:test-integration` against a live DB before trusting them.

A caveat I built in rather than discovered: the repository `join()`s the scoped
uow and never settles, and per `apps/media-worker/CLAUDE.md` an unsettled
transaction blocks `resetIntegrationTestDb`'s TRUNCATE forever. The `lookup`
helper settles in a `finally` for that reason. If the suite hangs on first run,
that is the first place to look.

One vestigial thing spotted, not a failure —
`apps/api/src/tests/collectionPaging.integration.tests.ts:79` still seeds a
`mediaAsset` display row by hand. Harmless (nothing reads asset rows), but it is
now fixture scaffolding for a table the API no longer touches.

---

## 6. Verification method

New tests were checked against deliberate mutations of the production code, each
reverted immediately afterwards. `grep -rn "MUTATION" apps packages` is clean and
every mutated line was confirmed restored to its exact original text.

| Mutation | Result |
| --- | --- |
| `swap = false` (never swap) | 3 tests fail — orientations 5, 6, 8 |
| `swap = true` (always swap) | 2 tests fail — no-orientation and orientation 1 |
| HEIC path swaps converter dimensions | 1 test fails — exactly the "verbatim" test |
| `if (derivatives.originalWasReplaced)` → `if (false)` | 1 test fails — the HEIC-never-reaches-S3 case |
| `completeTransaction` restored to pre-fix shape (reset on rollback only) | 4 worker-core tests fail, including the two-sequential-jobs one |
| `completeJobRow` splits its boundary after `markSucceeded` | 5 tests fail, including the same-transaction trace |
| moved test calls `getPendingUserAuthorizationByIdXX` | `TS2551` — the typecheck resolves the real worker-core interface |

Each mutation failed the tests intended to catch it and no others, which is the
check that the new assertions are load-bearing rather than incidentally true.

### A correction worth recording

While verifying 1.4 I first ran `tsc -p apps/media-worker/tsconfig.spec.json`,
got exit 0, and took that as proof the moved test type-checks. It was not.
`tsconfig.spec.json` extends `tsconfig.json`, which carries
`exclude: ["src/tests/**", "**/*.tests.ts"]`, and **exclude wins over include** —
so the program contained only the three EXIF `*.test.ts` files and none of
`src/tests/`. The real check was a direct `tsc` invocation naming the file.

That incidentally answers the review's open question 6 — *"was
`apps/media-worker`'s tsconfig meant to type-check `src/tests/**`?"*. It does
not, and cannot as configured. That is precisely why eight wrong-package imports
sat invisible in media-worker while the identical mistake in `apps/api` — whose
tsconfig does include tests — was loud enough to break the build. Fixing that
exclusion is out of scope here (you are handling test type-checking separately),
but it is the reason this whole class of bug stayed hidden.

---

## 7. One stale doc, not fixed

`apps/media-worker/CLAUDE.md` still says the job repositories live in
`@packages/media-core` ("The job repos and their queue mechanics live in
**`@packages/media-core`**… No worker-local or API-local copy"). After the split
the claim/settle half lives in worker-core and only `enqueueIfNoneActive`
remains in media-core. Left alone — it is documentation, outside this task — but
it is the same wrong-package belief that produced the eight test imports, written
down.

---

Suggested commit message:

```
test: move worker tests off media-core and cover derivative/uow/asset behavior
```
