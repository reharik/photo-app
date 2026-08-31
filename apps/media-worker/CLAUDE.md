# apps/media-worker — CLAUDE.md

Generic background task-runner. Knows nothing about media or notifications — those
are plugged in as tasks. Read the [root CLAUDE.md](../../CLAUDE.md) first for IoC,
repos, and UoW conventions; this file is the worker-specific tier.

## The `WorkerTask` abstraction

`src/types.ts`. `WorkerTask` is a **discriminated union on `type`**, not one shape:

```ts
export type WorkerTaskBase = { name: string; run: () => Promise<WorkerTaskOutcome> };
export type QueueWorkerTask = WorkerTaskBase & { type: 'queue'; order: number };
export type ScheduledWorkerTask = WorkerTaskBase & { type: 'schedule'; cadence: SweepCadence };
```

- There is **no `due()`** any more. Queue tasks are always due (the claim inside
  `run()` is itself the work-probe); scheduled tasks are gated by cadence in
  `IntervalGate`. Both are decided by `intervalGate.getTasksDue()`, not by the task.
- `order` is queue-tasks-only, spaced 100/200 on purpose — leave gaps to insert
  tasks without renumbering.
- `WorkerTask` and `WorkerTaskBase` are a **type-only module — intentionally no
  `build__*` factory**, so they are never registered as contracts. `QueueClaimable`
  in media-core (now `repositories/createJobQueueRepository.ts`) carries the same
  deliberate non-registration.

### Registration & discovery — one contract per task

The group's `baseType` is **`WorkerTaskBase`, not `WorkerTask`**: group membership
is NOMINAL (extends chains), so the union alias can never collect members — the
shared base is what every per-task contract transitively reaches.

Each task declares **its own named interface extending the union arm, with `name`
narrowed to a literal**:

```ts
export interface MediaImageTask extends QueueWorkerTask { name: 'media-image' }
export const build__MediaImageTask = (...): MediaImageTask => ({ ... });
```

Two reasons, both learned the hard way: discovery drops a factory annotated with
the `WorkerTask` union (`contract_not_resolved`), and a bare type alias of an arm
gets structurally deduped (two aliases of `QueueWorkerTask` = one contract with two
implementations, forcing an arbitrary `default`). A distinct interface per task =
one contract, one implementation, **no `default` registration needed** — which is
why, unlike the old setup, `ioc.config.ts` marks no default on any task.

Current tasks: `MediaDeletionTask` (queue, 100), `MediaImageTask` (queue, 200),
`StalledMediaJobSweepTask` (schedule, slow), `NotificationBatchTask` (schedule,
slow), `FastSweepNotificationTask` (schedule, fast).

> `WorkerJobProcessorBase` still exists as a nominal brand on the per-job
> processors, but the worker's `lifetimeMarkers` block is commented out — so it is
> now marker-only and confers **no lifetime**. See "Everything is a singleton" below.

## The run loop (`runMediaWorkerLoop.ts`) — two-phase pass

Each pass takes `intervalGate.getTasksDue()` and splits it on `isQueueTask`:

1. **Queue segment** — `runWorkerTasksOnce`: walk in `order`, **return on the first
   `'processed'`** (restart-from-top preemption, so the lowest-`order` task always
   gets the next claim). A throw propagates and skips the rest of the pass.
2. **Sweep segment** — `runAllTasks`, and only if the queue reported idle: run
   **every** due sweep, no early return, a throwing sweep is logged and the rest
   still run. This is what stops a busy queue from consuming a sweep's interval
   slot without ever firing it.

Either segment doing work re-polls immediately (`continue`); only an all-idle pass
sleeps `mediaWorkerPollIntervalMs`. `IntervalGate` stamps `lastRun` in a `.finally()`
wrapper around each sweep's `run`, so a sweep deferred by a queue burst fires once
when the queue drains — not lost, not repeated.

## Transactions — the loop is the safety net

**Boundaries live in the unit that owns them.** `inJobScope` / `inDeliveryScope` /
the per-job `*Context.ts` scope roots are **gone**; there is no `openXScope()` and
no child scope anywhere in the worker. Every unit injects `uow` directly and brackets
its own work:

- `uow.join()` — attach to the open transaction, or lazily open one.
- `uow.complete(ok)` — settle it; throws if none is open.
- `uow.settle(ok)` — settle it if open, no-op otherwise. The forgiving verb, for
  catch blocks and safety nets.
- `uow.beginIsolatedOnly()` — demand a _fresh_ boundary, throw if one is already
  open. Used only by the queue claim, which must commit independently.

After **every** task run — success or throw — `runWorkerTasksOnce` / `runAllTasks`
call `uow.settle(false)`. That is load-bearing, not belt-and-braces: see below.

### Everything here is a singleton, including the uow slot

The worker's `ioc.config.ts` comments out `lifetimeMarkers`, so every worker-local
unit is a **singleton**. `uow` comes from the composed media-core manifest, where it
is `scoped` — but the worker creates exactly one container and never a child scope,
so the scoped uow resolves once on the root and is, in practice, **one transaction
slot for the whole process**.

Consequences to keep in mind:

- A task that leaves a transaction open would hand it to the _next_ task. The loop's
  `settle(false)` after each run is what prevents that.
- Two tasks can never run concurrently — the loop is strictly sequential — so the
  single slot is safe. Do not add concurrency without giving each task its own scope.
- In tests, a unit built by hand needs a fake uow, and an integration test that
  resolves a repository straight off the container must settle it before `TRUNCATE`
  (`resetIntegrationTestDb` will otherwise block on the lock forever).

## The image pipeline — four units, three boundaries

`processNextMediaImageJob.ts` is now just an orchestrator over four injected units:

| unit                      | boundary                                                                                            | what it does                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `claimJobRow`             | claim commits its own; then `join` → `complete(true)`                                               | claims, reads the item projection, and classifies via `WorkVerdict`                  |
| `runImageStoragePipeline` | **none** — no DB at all                                                                             | S3 get → derivatives + EXIF → S3 put; returns a plain `PipelineResult`               |
| `completeJobRow`          | `join` → `complete(ok)` — commits on success, rolls back on `notOwned` / `itemGone` / `applyFailed` | `markSucceeded` (ownership check), re-read the item, `applyProcessingResults`, save  |
| `recordJobFailure`        | `join` → `complete(true)`                                                                           | `markPendingRetry` or `markFailed`, and fail the item only if we still owned the job |

Two things this buys, both previously bugs:

- **Storage I/O happens outside any transaction.** The pipeline returns a value
  instead of mutating a `MediaItem`, so nothing holds a row lock across an S3 round
  trip. (`markReadyAfterDerivatives` is gone; `MediaItem.applyProcessingResults`
  returns a `Result` the caller must check.)
- **The item is re-read inside the completion transaction.** The projection read at
  claim time is stale by the length of the pipeline.

`claimJobRow` classifies the item's status through the `WorkVerdict` axis on the
`MediaItemStatus` smart-enum — `processable` → hand to the pipeline, `succeeded` →
`markSucceeded` (never `markFailed`: a job row must not lie about a READY item),
`terminal` → `markFailed`, `retryable` (**`pending` and `uploaded`**) →
`markPendingRetry`. That last arm is the enqueue-before-commit race: a job row can
become visible a beat before the item's PROCESSING status commits, and a claim that
loses that race must come back, not go terminal.

## Queue claim / retry policy (`createJobQueueRepository`)

The job repos and their queue mechanics live in **`@packages/media-core`**
(`repositories/mediaProcessingJob/`, `repositories/mediaDeletionJob/`, and the shared
`repositories/createJobQueueRepository.ts` — renamed from `queueClaimable.ts`). The
worker composes the media-core manifest; the API reuses the same
`build__MediaProcessingJobRepository` for enqueue. No worker-local or API-local copy.

- **Job status is its own enum.** `MediaJobStatus` — separate from `MediaItemStatus`,
  which is the _item's_ lifecycle. Revived on the claim read via `withEnumRevival`.
- **The claim** is `SELECT … FOR UPDATE SKIP LOCKED` under `beginIsolatedOnly()`,
  then a conditional `pending → processing` flip with `attemptCount = attempt_count + 1`,
  then `complete(true)`. It must commit independently so the PROCESSING flip is
  visible to other workers before any downstream work runs — never a savepoint.
- **Ownership is a WHERE clause.** `markSucceeded` / `markFailed` / `markPendingRetry`
  all carry `WHERE status = 'PROCESSING'` and **return a value**: `true`/`false` for
  the first two, `'retrying' | 'exhausted' | 'notOwned'` for retry. A `false`/`notOwned`
  means the stalled sweep reclaimed the job — someone else owns the outcome, so do
  not touch the item.
- **Retry policy lives in the repository, not at call sites**, and is shared by both
  queues: `MAX_ATTEMPTS = 3`, exponential backoff from 30s capped at 1h. Callers pass
  no `availableAt`. Exceeding the cap terminal-fails instead of requeueing forever.
- **Enqueue** is targetless `ON CONFLICT DO NOTHING` — _not_ try/catch on 23505,
  which would abort the caller's transaction. It `join()`s the caller's transaction
  and settles nothing, so the job row commits with the item's status change.
- The `attemptCount` increment uses raw SQL, so it passes the **physical** column
  name `'attempt_count'` (bypasses the case-mapping layer).

The **stalled-job sweep** splits on the same cap: under it, back to PENDING ("a
worker died"); at/over it, FAILED _and_ the item moved off PROCESSING ("an item is
killing workers"). A stall never throws, so without that arm the sweep would
resurrect a poison job forever.

## Domain events — the worker has no bus

`EventPublisher` is registered as **`noopEventPublisher`** (`ioc.config.ts`
`registrations.EventPublisher`), which logs and discards. The worker writes through
aggregates whose `persist` drains events into the uow, but nothing here dispatches
them — that is the API's job. This is also why the worker sidesteps the
`uow → eventPublisher → domainEventHandlers` construction cycle the API has to avoid.

## The no-viewer (system-read) tier

The worker has **no authenticated viewer** — there is no `viewerId` registered
anywhere. Two access tiers:

- **System repos** (`System*`): ungated reads/writes for viewer-less work (album
  titles, user emails, notification/activity sweeps). They inject `uow` like
  everything else now, not raw Knex.
- **Domain repos via the uow**: `MediaItemRepository` etc. — same injection, no
  scope ceremony.

Where the API would gate on a viewer, the worker either uses a `System*` repo or
supplies an **actor id taken from the job row** (`job.createdBy`) for audit columns.

## Boot (`main.ts` / `app.ts` / `container.ts`)

`main.ts` builds the container and calls `container.cradle.app()`. `build__App` runs
`logMediaWorkerStartup()`, starts the loop, and wires shutdown (stop the loop, await
it, `database.destroy()`). The root container does not register itself.

**The startup probe is fail-fast**: it logs _and rethrows_ on a failed Postgres or S3
check, so a worker that cannot reach its dependencies dies at boot rather than
spinning a poll loop that can never do work. Unit tests for it must assert on the
rejection and mock `@aws-sdk/client-s3` (via `jest.unstable_mockModule`, since the
suite runs as real ESM).

Adding a new job type = a `build__XxxTask` returning its own named interface that
extends `QueueWorkerTask` or `ScheduledWorkerTask` (it auto-joins `workerTasks`), plus
a runner that claims via a job repository and brackets its own `join`/`complete`.
Then `npm run gen:ioc:worker`.

## Known open item

`ioc inspect` reports one manifest validation error:
`FastSweepNotificationStrategy` has two implementations (`albumSharedStrategy`,
`albumSharedWithNonUserStrategy`) and no `default`. The group resolves fine — the
contract is only ever consumed through `fastSweepNotificationStrategies` — but until
one is marked `default: true` in `ioc.config.ts`, `ioc validate` stays red.
