# apps/media-worker — CLAUDE.md

Generic background task-runner. Knows nothing about media or notifications — those
are plugged in as tasks. Read the [root CLAUDE.md](../../CLAUDE.md) first for IoC,
repos, and UoW conventions; this file is the worker-specific tier.

## The `WorkerTask` abstraction

`src/types.ts`:

```ts
export type WorkerTask = {
  name: string;
  due: () => boolean | Promise<boolean>; // cheap gate before run()
  run: () => Promise<WorkerTaskOutcome>; // 'processed' | 'idle'
  order: number; // lower = higher priority
};
```

- `WorkerTask` is **type-only — intentionally no `build__` factory** (it's never an
  IoC contract; the concrete tasks are). Same deliberate non-registration applies to
  `QueueClaimable` (`@packages/media-core`'s `repositories/queueClaimable.ts`).
- `order` is spaced 100/200/300 on purpose — leave gaps to insert tasks without
  renumbering.
- Two `due()` styles:
  - **Queue tasks**: `due: () => true` — the claim inside `run()` is itself the
    work-probe.
  - **Scheduled tasks**: gate on an interval (`intervalGate(intervalMs)` closure,
    e.g. `slowSweepIntervalMS`, default 5 min).

### Registration & discovery

Concrete tasks are `build__` factories returning `WorkerTask`, auto-collected into the
`workerTasks` group (`ioc.config.ts`: `workerTasks: { kind: 'collection', baseType: 'WorkerTask' }`).
The cradle exposes `workerTasks: ReadonlyArray<WorkerTask>`; the loop receives the
whole group. Current tasks: `build__MediaDeletionTask` (100),
`build__MediaImageTask` (200), `build__NotificationSweepTask` (300).

`ioc.config.ts` marks `notificationSweepTask: { default: true }` on the `WorkerTask`
contract. `WorkerTask` exists only to group — it's never injected individually — but a
multi-impl contract still requires one default, so the choice here is arbitrary (see
root CLAUDE.md "The `default` registration").

> `WorkerJobProcessorBase` (`workerJobProcessorBaseType.ts`) still exists but is now
> **only a lifetime marker** (→ scoped) for the per-job processors — NOT the task
> abstraction.

## The run loop (`runMediaWorkerLoop.ts`)

A pass **returns immediately on the first `'processed'`** (restart-from-top, not
round-robin) — a busy high-priority task can starve lower-priority ones by design.

## Queue claim / locking (`QueueClaimable`)

The job repos and their queue mechanics now live in **`@packages/media-core`**
(`repositories/mediaProcessingJob/`, `repositories/mediaDeletionJob/`, and the shared
`repositories/queueClaimable.ts`) — the worker composes the media-core manifest and the
API reuses the same `build__MediaProcessingJobRepository` for enqueue. There is no
longer a worker-local (or API-local) copy.

`createQueueClaimable` is a shared factory for both queue tables (`media_processing_job`,
`media_deletion_job`), **composed by hand inside the two repo factories** (not a
`build__` contract). The claim is `SELECT ... FOR UPDATE SKIP LOCKED` in a short
transaction, then a conditional `pending → processing` flip with
`attemptCount = attempt_count + 1`.

- Status values come from the `MediaItemStatus` smartenum (`@packages/contracts`) —
  written as `MediaItemStatus.pending.value` etc., and revived on the claim read via
  `withEnumRevival`. There is no separate job-status enum.
- The increment uses raw SQL, so it passes the **physical** column name
  `'attempt_count'` (bypasses case-mapping).
- Enqueue is idempotent: catches PG unique-violation `23505` and returns.
- Deletion has retry/backoff (`markPendingRetry`, `MAX_MEDIA_DELETION_JOB_ATTEMPTS = 8`);
  image processing does not (only `markSucceeded`/`markFailed`).

## The no-viewer (system-read) tier

The worker has **no authenticated viewer** — there is no `viewerId` registered
anywhere. Two access tiers:

- **System repos** (`System*`, singleton, raw Knex): ungated reads/writes for
  viewer-less work (album titles, user emails, notification/activity sweeps).
- **Scoped domain repos via UoW**: `MediaItemRepository` etc. depend on `uow` and are
  only resolvable inside `withUnitOfWork(container, fn)`. The worker opens a short UoW
  scope around just the DB load/save.

Where the API would gate on a viewer, the worker either uses a `System*` repo or
supplies an **actor id taken from the job row** (`job.createdBy`) for audit columns
(`updatedBy`) — the job's creator stands in for the absent viewer.

**Runner vs processor split:** the `build__RunNext*Job` runner (singleton) is the
orchestrator — it claims on the singleton DB and runs storage I/O (S3)
**outside** the transaction; the `build__ProcessNext*Job` processor (scoped, extends
`WorkerJobProcessorBase`) holds only the transactional load/save run inside the UoW
scope. **Storage I/O is not transactional with the DB** — hence the idempotent-delete

- retry design on the deletion side.

## Boot (`main.ts` / `container.ts`)

The root container **registers itself as `container`** so tasks can resolve it and call
`withUnitOfWork(container, ...)` to open per-job UoW scopes.

Adding a new job type = add a `build__XxxTask` returning a `WorkerTask` (it auto-joins
`workerTasks`) + a runner that claims via a `QueueClaimable` and does work inside
`withUnitOfWork`. Then `npm run gen:ioc:worker`.
