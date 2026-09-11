# UnitOfWork test migration — `settle` / `join` / `beginIsolatedOnly`

Migration of the test suite off the removed `UnitOfWork` verbs and onto
`start` / `db` / `complete` / `isOpen` / `flagRollbackOnly` / `inTransaction`.

**19 test files touched. No production code changed.**

---

## 1. Counts by category

| Category                                              | Count | Notes                                                                 |
| ----------------------------------------------------- | ----- | --------------------------------------------------------------------- |
| **(a)** setup/teardown opening its own transaction    | 7     | 5 → `inTransaction`, 1 → `start`/`finalize` split, 1 teardown dropped |
| **(b)** fake member that only satisfied the interface | 9     | dead verbs deleted from 8 fakes + one whole dead `testUow`            |
| **(c)** assertion that the unit settled or joined     | 18    | see §2 — the reviewable section                                       |
| **(d)** end-to-end rollback assertions                | 6     | 5 pass unchanged; 1 fails → production bug (§4.1)                     |
| **Files touched**                                     | 19    | 13 unit, 6 integration                                                |

Two files needed more than a verb swap because their _subject_ moved in the same
commit (`5ced1ba`), not just the interface:

- `processNextMediaImageJob.tests.ts` — `claimJobRow.ts` was renamed/split into
  `triageJob.ts` and the claim moved up into the runner. Rewritten against the new
  four-unit shape.
- `fastSweepOrphanedAuthorization.integration.tests.ts` — `build__FastSweepNotification`
  was decomposed into four injected units. Rewired; the fake `notify` now goes into
  `build__SendNotificationForPayload`, which is what owns the `NotificationService` now.

---

## 2. Every (c) decision

The recurring judgement: **the removed verbs were how the callee talked about a
boundary it no longer owns.** Repositories and phase-units are now pure `db()`
users; boundaries moved up to the worker task's `run()` and the GraphQL envelop
plugin. Where the callee lost transaction knowledge, the assertion was deleted
rather than restated as an `inTransaction` assertion — asserting on the caller's
behaviour from inside the callee's test would be worse than asserting nothing.

| File                                                                                      | Asserted before                                                                                                                                           | Asserts now                                                                                                                                             | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `media-worker/…/mediaProcessingJobRepository.tests.ts`                                    | `boundary.begun === 1`, `joined === 0`, `completed === [true]` on the empty claim                                                                         | `dbCalls === 1` — the empty `FOR UPDATE SKIP LOCKED` select issues no second query                                                                      | `createJobQueueRepository` only calls `uow.db()`; the claim's boundary is opened by `processNextMediaImageJob`'s `inTransaction`. Nothing about lifecycle is this unit's to assert. Replaced with the real remaining contract: don't write when nothing was locked.                                                                                                                                                                                                                                 |
| ″                                                                                         | `boundary.begun === 1`, `completed === [true]` on a successful claim                                                                                      | `dbCalls === 2` — select then update, on one handle                                                                                                     | Same. The surviving contract is that the lock taken by the select is still held when the update lands.                                                                                                                                                                                                                                                                                                                                                                                              |
| `media-core/…/mediaProcessingJobRepository.tests.ts`                                      | `boundary.joined === 1`, `begun === 0`, `completed === []` — "the enqueue joins and settles nothing"                                                      | **deleted**                                                                                                                                             | This was the enqueue-before-commit guard. It is now _structural_, not behavioural: `db()` throws outside a boundary, so there is no code path on which the enqueue could open one of its own. The assertion tested a property that can no longer be violated. Recorded in the file's header comment instead.                                                                                                                                                                                        |
| `media-worker/…/logMediaWorkerStartup.tests.ts`                                           | `boundary.joined === 1`, `completed === [true]`, `settled === []` (whole `it` block: "runs the Postgres probe inside a transaction it opens and commits") | rewritten as "probes Postgres with a plain select on the injected handle": `rawCalls === ['select 1 as ok']`                                            | The probe went back to `database: Knex` and injects no `uow` at all. Correct for it — it runs at boot, before any boundary exists. Kept the block rather than deleting it because there is still a real regression to pin: a probe that reached for `uow.db()` would throw at boot.                                                                                                                                                                                                                 |
| ″                                                                                         | `boundary.settled === [false]`, `completed === []` on the Postgres failure path                                                                           | **deleted**                                                                                                                                             | Same; no uow. The rejection + error-log assertions (the block's actual subject) are untouched.                                                                                                                                                                                                                                                                                                                                                                                                      |
| ″                                                                                         | `boundary.completed === [true]` on the S3 failure path                                                                                                    | `rawCalls === ['select 1 as ok']`                                                                                                                       | Preserves the _ordering_ claim the assertion was really making — Postgres passed before S3 was reached — without inventing a boundary.                                                                                                                                                                                                                                                                                                                                                              |
| `media-worker/…/runMediaWorkerLoop.tests.ts` (`runWorkerTasksOnce`)                       | `settlements === [false, false]` — "one settle per task run"                                                                                              | `completions === []`, **plus a new case** asserting `completions === [false]` and the "left a transaction open" log when a task really does abandon one | This one **inverted**, which is why it needed care. The old net settled unconditionally; the new net is `if (uow.isOpen()) await uow.complete(false)`, and `complete` _throws_ with nothing open. So "no cleanup on the normal path" is now the load-bearing assertion — a regression to unconditional `complete` would throw out of a `finally` and mask the task's own outcome. The old assertion's intent (a task must not inherit the previous task's boundary) is preserved in the added case. |
| ″ (`runAllTasks`)                                                                         | `settlements === [false, false]` on the throwing-sweep case                                                                                               | `completions === []`, **plus a new case** for a sweep that abandons a boundary                                                                          | Same inversion. `inTransaction` already rolls back on the way out of a throwing callback, so the net correctly finds nothing open.                                                                                                                                                                                                                                                                                                                                                                  |
| `processNextMediaImageJob.tests.ts` — `build__ClaimJobRow` → `build__TriageJob` (6 cases) | `commits === [true]` / `commits === []` on each triage arm                                                                                                | **deleted** from all six                                                                                                                                | `build__TriageJob` takes an already-claimed job, injects no `uow`, and does no lifecycle. Its contract is the verdict and which job-row write it makes; both are still asserted.                                                                                                                                                                                                                                                                                                                    |
| ″ — `build__CompleteJobRow` (5 cases)                                                     | `commits === [true]` / `[false]`; `trace === ['join','markSucceeded','getById','save','complete(true)']`                                                  | `commits` assertions **deleted**; trace narrowed to `['markSucceeded','getById','save']`                                                                | `build__CompleteJobRow` no longer takes `uow`. It signals failure _as data_ (`notOwned`/`itemGone`/`applyFailed`) and the runner rolls back on that. The write **order** is still this unit's contract — `markSucceeded` is the ownership check and must precede what it authorises — so the trace assertion survives with the boundary entries removed. The atomicity claim the old trace made moved to the runner (next row).                                                                     |
| ″ — `build__ProcessNextMediaImageJob`                                                     | nothing (the runner had no uow before)                                                                                                                    | **added** `boundaries` assertions on every case, e.g. `[true, true, false, true]` for the applyFailed path                                              | The runner is the unit that genuinely owns lifecycle now, so this is where `start`/`complete` assertions belong. The `false` in that sequence pins `flagRollbackOnly` — without it the runner would commit the very writes it just decided were wrong. Also added a case asserting the S3 pipeline runs **outside** every boundary (`['claim','commit','commit','pipeline','commit']`).                                                                                                             |
| `worker-core/unitOfWork.tests.ts`                                                         | `await uow.settle(false)` clears an abandoned trx; "should be a no-op when nothing is open"                                                               | `isOpen()` + `complete(false)`; the no-op case became **`complete()` rejects with `/Transaction not started/`**                                         | Direct test of the uow itself, so the verb change _is_ the subject. The second case flipped meaning entirely — forgiveness became refusal — which is exactly what makes the loop's `isOpen` guard necessary rather than decorative.                                                                                                                                                                                                                                                                 |
| `media-core/unitOfWork.tests.ts`                                                          | `settle(false)` clears an abandoned request trx                                                                                                           | `complete(false)`; **added** a case that `complete()` with nothing open rejects                                                                         | Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `authController.tests.ts` (2 cases)                                                       | `expect(authService.settle).toHaveBeenCalledWith(false)`                                                                                                  | `expect(authService.complete).toHaveBeenCalledWith(false)`                                                                                              | Category (c) third bullet: the controller genuinely still drives the boundary verb directly, so the assertion is retargeted, not deleted. **Caveat recorded in the test:** the fake is inert, so this passes; against a real uow the success-path call throws. See §4.1.                                                                                                                                                                                                                            |
| `authService.verifyCodeAndSetPassword.tests.ts` (8 cases)                                 | `h.settlements() === [false]` alongside `h.completions() === []`                                                                                          | single `h.completions()` oracle                                                                                                                         | With `settle` gone there is one verb, so two parallel oracles collapse into one. The `order` array (`['save','consume','commit','notify']` etc.) — the suite's real subject — is unchanged.                                                                                                                                                                                                                                                                                                         |

---

## 3. Tests left without a meaningful assertion

**None.** Three cases lost their only lifecycle assertion and were given back a
real one rather than left as shells:

- `logMediaWorkerStartup` › "runs the Postgres probe inside a transaction" — would
  have become an empty block; rewritten to pin that the probe uses the raw pooled
  handle (`rawCalls === ['select 1 as ok']`), which is the property that actually
  matters now, since `uow.db()` would throw at boot.
- `mediaProcessingJobRepository` (worker) › both `claimNextAvailableJob` cases —
  would have been left asserting only the returned row; given `dbCalls` assertions
  that pin the select-then-update shape.

The six `build__TriageJob` cases and five `build__CompleteJobRow` cases lost their
`commits` assertions but each retains substantive assertions on outcome and on
which job-row write was made, so none are shells.

---

## 4. Suspected production bugs — **not fixed**

### 4.1 `authController.setPassword` completes a transaction that is already committed

`apps/api/src/controllers/authController.ts:207-210`

```ts
} finally {
  await authService.complete(false);
  await dispose();
}
```

`AuthService.verifyCodeAndSetPassword` commits itself on the success path
(`authService.ts:176`, `await uow.complete(true)`) because `notifyUser` must run
post-commit. `complete` is `uow.complete`, which **throws** when no transaction is
open. So on every successful signup the `finally` throws
`Error: Transaction not started` _after_ the cookie is set but _before_ the 200 is
returned — the user's account is created and committed, and they get a 500.

This is what `settle`'s no-op-when-nothing-open behaviour was hiding. The three
remaining `api:test` unit failures are all this:

- E6 › "saves + consumes, then commits, then notifies" — throws instead of returning.
- E6 › "a notify RESULT failure still returns ok" — same.
- E6 › "a notify REJECTION propagates" — **worst case**: expected `"SES exploded"`,
  received `"Transaction not started"`. The `finally` _replaces_ the real error.

Reproduced end-to-end: `api:test-integration` →
`authPasswordReset.integration.tests.ts`, 7/7 cases fail with
`Transaction not started` thrown from `unitOfWork.ts:136`.

### 4.2 Nothing opens a boundary for the `AuthService` scope

The other half of 4.1, and why E1–E4 fail too, not just the success path.
`build__AuthService` returns `{ verifyCodeAndSetPassword, complete: uow.complete }` —
no `start` — and neither `openAuthServiceScope()` nor `authController` opens one.
Under the new model the first repository call hits `uow.db()`, which throws.

The three GraphQL scope roots (`requestContextFactories.ts`) all expose
`start: uow.start`; the AuthService root exposes none.

**This forced an explicit assumption in the test**, flagged here because it is the
one place I stubbed something production does not do. `throughBoundary` in
`authService.verifyCodeAndSetPassword.tests.ts` calls `uow.start()` before invoking
the service, with a comment saying so. Without it all 8 cases fail on the same
missing `start` and the suite stops testing what it is about (the
consume→commit→notify ordering). With it, exactly the 3 genuine failures in 4.1
remain.

### 4.3 The public GraphQL branch never calls `start()`

`apps/api/src/graphql/server/useScopedContainer.ts:91-110`

The authenticated **write** (line 46) and **read** (line 70) branches both call
`await …GraphQlContext.start()`. The **public** branch does not, though
`build__PublicRequestContext` exposes `start: uow.start`. Every share-link request
therefore throws on its first `uow.db()` and then throws again in
`onExecuteDone` → `finalize`.

Confirmed: `graphql.publicAccess.integration.tests.ts` — both cases get **HTTP 500**
where 200 is expected. `graphql.yoga.integration.test.ts` — the three "while logged
out" cases fail the same way. `revokeAndReshare` A2 fails via the AuthService path (4.2).

This looks like a one-line omission in an otherwise-completed migration (the read
and write branches were being finished during this session).

### 4.4 `runWorkerTasksOnce` lost its error log

`apps/media-worker/src/runMediaWorkerLoop.ts:29-38`

```ts
try {
  outcome = await task.run();
} finally {
  if (uow.isOpen()) { … }
}
```

`try/finally` with no `catch`. A throwing queue task is now logged **nowhere**: this
function rethrows silently, and the loop's outer handler swallows it deliberately —
its comment still says _"runWorkerTasksOnce already logged the task name and the
error before rethrowing"_, which is no longer true. A crashing queue task is
invisible in the logs.

The two remaining `media-worker:test` failures are this, and they are honest
assertions that were passing before commit `5ced1ba`:

- "When a task throws › should log the loop error and continue after the poll interval"
- "When a queue task throws and sweeps are due › still runs the due sweeps"

Both expect `logger.error('[mediaWorker-run_once] task "…" threw', Any<Error>)`.

### 4.5 The media-deletion queue has no processor

`processNextMediaDeletionJob.ts` was **deleted** in `5ced1ba` and not replaced.
`processNextMediaDeletionJob.tests.ts` therefore fails to load (`Could not locate
module`) — this is the one suite left failing, and I left it that way deliberately:
deleting it would erase the only remaining record of the regression.

Evidence it is a regression rather than an intentional removal:

- `worker-core` still ships `build__MediaDeletionJobRepository` and its unit tests
  still pass (I migrated its fake).
- `mediaWorkerTasks.ts` registers only `MediaImageTask`, but its comment still reads
  _"Priority-ordered tasks: deletion before image."_
- `apps/media-worker/CLAUDE.md` still documents `MediaDeletionTask (queue, 100)` as
  a current task.

Net effect: deletion jobs can still be enqueued but nothing ever claims them.

### 4.6 `media-core`'s `UnitOfWork` has no `isOpen`

`worker-core`'s interface declares and implements `isOpen()`; `media-core`'s does
not. That asymmetry is why the API-side integration teardowns could not use the
`if (uow.isOpen())` guard the brief suggests, and were restructured instead (§5).
Not a bug on its own, but it blocks the idiom on the API side.

### Stale documentation (not code, noted for completeness)

`apps/media-worker/CLAUDE.md` still documents the removed verbs as current API
(`uow.join()`, `uow.settle(ok)`, `uow.beginIsolatedOnly()`), the deleted
`claimJobRow` unit, and `MediaDeletionTask`. Its "The image pipeline — four units,
three boundaries" table describes an architecture that no longer exists.

---

## 5. Fakes inventory

**9 uow test doubles.** All migrated; none consolidated.

| #   | Location                                                        | Shape after migration                                                                               | Diverges?                                                        |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | `media-worker/…/mediaDeletionJobRepository.tests.ts`            | minimal: `start`/`db`/`complete`/`isOpen`/`inTransaction`                                           | near-identical to #2                                             |
| 2   | `media-worker/…/mediaProcessingJobRepository.tests.ts`          | same, over a knex-chain `db`                                                                        | near-identical to #1                                             |
| 3   | `media-core/…/mediaProcessingJobRepository.tests.ts`            | same, no `isOpen` (media-core's interface lacks it — §4.6)                                          | near-identical to #2                                             |
| 4   | `media-worker/…/runMediaWorkerLoop.tests.ts`                    | **stateful**: real `isOpen` flag, `complete` throws when closed, plus an `abandonBoundary()` helper | intentionally different — the loop's safety net _is_ the subject |
| 5   | `media-worker/…/processNextMediaImageJob.tests.ts`              | **stateful + honours `flagRollbackOnly`**; `boundaries: boolean[]` per `inTransaction`              | intentionally different — the runner owns the boundaries         |
| 6   | `api/…/authService.verifyCodeAndSetPassword.tests.ts`           | **stateful, faithful**: `start` refuses to nest, `complete` throws when closed                      | intentionally different — fidelity here is what surfaced §4.1    |
| 7   | `media-worker/…/logMediaWorkerStartup.tests.ts`                 | **removed entirely** → replaced by `createFakeDatabase` (a Knex stand-in)                           | unit no longer injects a uow                                     |
| 8   | `media-core/…/writeServiceTestHarness.ts` (`testUow`)           | **deleted** — `build__FinalizeMediaItemUpload` no longer takes a `uow`                              | category (b): dead weight                                        |
| 9   | `api/…/authController.tests.ts` (`AuthService` fake, not a uow) | `settle` → `complete`, inert                                                                        | —                                                                |

**Divergence:** #1–#3 are near-duplicates and are the obvious consolidation
candidate; deliberately left alone per the brief. #4–#6 are stateful _on purpose_
and should not be folded into a shared helper — each models the specific property
its unit under test depends on, and #6's fidelity is precisely what caught §4.1.

Three integration tests use the **real** container-resolved uow rather than a fake;
those were restructured, not faked:

- `pendingAuthorizationLookup.integration.tests.ts` — `settle(false)` → `inTransaction(…)`
- `stalledMediaJobSweep.integration.tests.ts` — direct repo call → `inTransaction(…)`
  _(was not in the `settle`/`join` grep — it relied on the removed lazy-join and
  broke the same way)_
- `collectionPaging.integration.tests.ts` — 5 direct read-repository calls wrapped in
  a local `read()` helper; teardown mop-up removed

Two teardowns (`revokeAndReshare`, `shareRosterDeliveryStatus`) had their
`uow.settle(false)` line **deleted** rather than translated: both drive the API
exclusively through yoga, so the envelop plugin owns and closes the transaction.
Keeping an unconditional `complete(false)` there would have thrown on every test.

---

## 6. Final suite and typecheck

### Typecheck — clean

```
NX   Successfully ran target typecheck for 9 projects and 22 tasks they depend on
```

(Was 13 errors in `apps/api` test files at the start; 0 now. Note that
`media-worker`, `media-core` and `worker-core` exclude `src/tests/**` from
typecheck, so their test files are only checked by lint and by jest at runtime.)

### Lint — clean

0 errors across `api`, `media-worker`, `media-core`, `worker-core`.
(4 pre-existing `no-unsafe-*` warnings in `useScopedContainer.ts`, production code.)

### Unit suite — `nx run-many --target=test --all`

| Project                                   | Suites     | Tests  | Failing                                      |
| ----------------------------------------- | ---------- | ------ | -------------------------------------------- |
| contracts, infrastructure, heic-converter | 3 + 2      | 6 + 18 | 0                                            |
| notifications                             | (in above) | —      | 0                                            |
| worker-core                               | 2          | **24** | 0                                            |
| media-core                                | 8          | **63** | 0                                            |
| api                                       | 3          | 29     | **3** → §4.1                                 |
| media-worker                              | 15         | 97     | **2** → §4.4, **+1 suite won't load** → §4.5 |
| web                                       | 0          | 0      | 0 (no tests)                                 |

**Baseline → now:** 51 failing tests → **5 failing**, and all 5 are production
defects rather than stale tests.

| Project      | Before                               | After                              |
| ------------ | ------------------------------------ | ---------------------------------- |
| worker-core  | 8 failed / 20                        | **0 failed / 24**                  |
| media-core   | 10 failed / 57                       | **0 failed / 63**                  |
| api          | 10 failed / 29                       | 3 failed / 29                      |
| media-worker | 21 failed / 67 (2 suites unloadable) | 2 failed / 97 (1 suite unloadable) |

### Integration suites

`media-worker:test-integration` — **13/13 passing, 3/3 suites** (was 2 suites failing).

`api:test-integration` — 91 passed, 13 failed, 1 skipped / 105.
All 13 failures are §4.1–4.3, in four suites:

| Suite                                       | Failing | Cause                    |
| ------------------------------------------- | ------- | ------------------------ |
| `authPasswordReset.integration.tests.ts`    | 7       | §4.1 / §4.2              |
| `graphql.publicAccess.integration.tests.ts` | 2       | §4.3 (HTTP 500)          |
| `graphql.yoga.integration.test.ts`          | 3       | §4.3 (logged-out paths)  |
| `revokeAndReshare.integration.tests.ts`     | 1       | §4.2 (guest-accept path) |

Note: the API-side production migration was being completed during this session —
`start` was added to the read and write scope roots and to the envelop plugin's read
and write branches while this work was in progress. §4.3 (public branch) and §4.2
(AuthService scope) are the two spots not yet reached.

---

Suggested commit message:

    test: migrate suites off removed UnitOfWork verbs (settle/join/beginIsolatedOnly)
