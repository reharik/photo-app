# Worker scope-root forensics

Read-only investigation. No files edited except this report, no codegen, no tests, no
prettier. All history claims below are quoted from `git show` / `git log` output.

---

## 1. Headline

**All three scope roots exist in git and are fully recoverable. Their removal was
deliberate, done in a single commit — `282b92b` "work apply boundaries to worker process
and then e2e" (2026-08-31) — which in the same diff deletes the three `*Context.ts` files
and `inJobScope.ts`, rewrites every consumer to inject `uow` directly, and rewrites
`apps/media-worker/CLAUDE.md` to say in prose that they are gone and why. The removal has
nothing to do with the `worker-core` bounded-context split, which happened six days later
on a different branch.**

---

## 2. Current-state hits (Q1)

### `rg -n "ScopeRoot<" --type ts`

Four hits, **all in `apps/api`. Zero in `apps/media-worker`, zero in `@packages/worker-core`,
zero in `@packages/media-core`.**

```
apps/api/src/services/authService.ts:53:}: AuthServiceDeps): ScopeRoot<AuthService, Record<string, never>> => {
apps/api/src/graphql/context/requestContextFactories.ts:28:}: AuthedDeps): ScopeRoot<AuthenticatedReadScopeServices, { viewerId: EntityId }> => ({
apps/api/src/graphql/context/requestContextFactories.ts:39:}: AuthedDeps): ScopeRoot<AuthenticatedWriteScopeServices, { viewerId: EntityId }> => ({
apps/api/src/graphql/context/requestContextFactories.ts:59:}: PublicDeps): ScopeRoot<PublicReadScopeServices, { publicLinkId: string }> => ({
```

Plus the import and one comment:

```
apps/api/src/services/authService.ts:21:import { ScopeRoot } from 'ioc-manifest';
apps/api/src/graphql/context/requestContextFactories.ts:10:import { ScopeRoot } from 'ioc-manifest';
apps/api/src/graphql/context/types.ts:28:// ── what the SCOPE contributes — this is the ScopeRoot contract now ──
```

**This asymmetry is the finding: the API kept the scope-root mechanism; the worker gave it
up entirely.**

### `rg -n "open[A-Za-z]*Scope" --type ts`

All live hits are API-side (`openAuthServiceScope`, `openAuthenticatedReadGraphQlContextScope`,
`openAuthenticatedWriteGraphQlContextScope`, `openPublicRequestContextScope`) across
`apps/api/src/controllers/authController.ts`, `apps/api/src/graphql/server/useScopedContainer.ts`
and four API test files.

The **only** worker hit is a commented-out ghost line:

```
apps/media-worker/src/tasks/schedule/batchNotification/notificationBatcher.ts:25:
  // openEmailDeliveryContextScope: OpenEmailDeliveryContextScope;
```

That is a dead dep line left in `NotificationBatcherDeps`. It is the sole surviving trace
of the three roots in the working tree.

### `rg -n "inJobScope|mediaJobContext|mediaDeletionJobContext|emailDeliveryContext"`

**One hit, and it is documentation, not code:**

```
apps/media-worker/CLAUDE.md:75:**Boundaries live in the unit that owns them.** `inJobScope` / `inDeliveryScope` /
```

The full paragraph in the current `apps/media-worker/CLAUDE.md` reads:

> **Boundaries live in the unit that owns them.** `inJobScope` / `inDeliveryScope` /
> the per-job `*Context.ts` scope roots are **gone**; there is no `openXScope()` and
> no child scope anywhere in the worker. Every unit injects `uow` directly and brackets
> its own work

### Corroborating config state

- `apps/media-worker/src/ioc.config.ts` has **no `lifetimeMarkers` block at all** and no
  scope-related config. It composes `@packages/worker-core`, `@packages/infrastructure`,
  `@packages/notifications`.
- `scopeProvided` survives in exactly one place monorepo-wide:
  `packages/context/media-core/src/ioc.config.ts:38: scopeProvided: ['viewerId', 'publicLinkId']`.
  Neither `worker-core` nor the worker app declares any.
- `packages/context/worker-core/src/generated/ioc-manifest.ts:244-256` still registers
  `uow` with `lifetime: 'scoped'`, `lifetimeSource: 'lifetime-marker'` — but nothing in the
  worker ever opens a scope, so that scoped registration resolves once on the root
  container and is one transaction slot for the whole process.
- `packages/context/worker-core/src/ioc.config.ts:24` still carries a comment referring to
  `beginUnitOfWorkScope` — a function that no longer exists anywhere (deleted in the same
  `282b92b`). Second surviving ghost.

---

## 3. History table (Q2)

Searched with `git log --all -S`. Only four commits ever touched these identifiers, and all
four are on `main`'s first-parent lineage (reachable from `main`, `landing_page`,
`email_delivery_tracking`, `ses_and_sqs_consumer`, `ubiquitous_uow`, and the current
`worker_core_split_out`).

| Scope root | Introduced | Last good | Removed | Deliberate? |
|---|---|---|---|---|
| `mediaJobContext` (`MediaJobContext`) | `6a9c25e` 2026-08-21 | `d3ade10` 2026-08-28 | `282b92b` 2026-08-31 | **Yes — explicit** |
| `mediaDeletionJobContext` (`MediaDeletionJobContext`) | `6a9c25e` 2026-08-21 | `d3ade10` 2026-08-28 | `282b92b` 2026-08-31 | **Yes — explicit** |
| `emailDeliveryContext` (`EmailDeliveryContext`) | `6a9c25e` 2026-08-21 | `d3ade10` 2026-08-28 | `282b92b` 2026-08-31 | **Yes — explicit** |
| `inJobScope` helper | `6a9c25e` 2026-08-21 | `d3ade10` 2026-08-28 | `282b92b` 2026-08-31 | **Yes — explicit** |

### The commit messages, verbatim

Introduction — `6a9c25e`, 2026-08-21 14:16:32 -0500:

> `working on migration to better scoped service ioc`

`6a9c25e --stat` confirms it created all three files:

```
 .../src/infrastructure/database/emailDeliveryContext.ts       |   30 +
 .../src/infrastructure/database/mediaDeletionJobContext.ts    |   32 +
 .../src/infrastructure/database/mediaJobContext.ts            |   33 +
```

Last good — `d3ade10`, 2026-08-28 12:59:16 -0500:

> `building new uow lifecycle and methods`

Removal — `282b92b`, 2026-08-31 15:05:45 -0500 (parent `d3ade10`):

> `work apply boundaries to worker process and then e2e`

All four messages are **one-line, with empty bodies**. So the *subject lines alone* are
thin — "work apply boundaries to worker process" gestures at it but does not name the scope
roots. **The deliberateness evidence is not the commit message; it is the 271-line
`apps/media-worker/CLAUDE.md` rewrite in the same commit**, which is prose written by the
author describing the change. That is quoted in §5.

The `282b92b --stat` shows the three deletions and the replacement landing together:

```
 .../database/emailDeliveryContext.ts                          |  30 ---
 .../database/mediaDeletionJobContext.ts                       |  32 ---
 .../src/infrastructure/database/mediaJobContext.ts            |  40 ---
 .../mediaWorkers/processMediaImage/inJobScope.ts              |  40 ---
 .../infrastructure/database/noopEventPublisher.ts             |  21 ++
 apps/media-worker/CLAUDE.md                                   | 271 ++++++++++-------
 .../mediaWorkers/processMediaImage/completeJobRow.ts          |  64 +++--
 .../mediaWorkers/processMediaImage/recordJobFailure.ts        |  50 ++--
 .../mediaWorkers/processNextMediaDeletionJob.ts               |  94 ++-----
 .../batchNotification/notificationBatcher.ts                  |  84 +++----
 .../infrastructure/repositories/withUnitOfWork.ts             |  44 ----
 .../infrastructure/repositories/unitOfWork.ts                 |  67 +++--
```

Every file that consumed an opener is rewritten **in the same commit** as the deletion.
Nothing was orphaned. This is not an incidental wholesale delete.

### Nothing hiding elsewhere

- `git branch -a` — 20 local, 30 remote. The four commits above are contained in the
  branches listed at the top of this section; no branch contains a *later* version of the
  scope roots. No `scope`-named or `worker-boundary`-named branch exists.
- `git reflog` (60 entries, back to 2026-08-18) — two commits were `reset --hard`-ed away
  on 2026-08-21 (`1e64587` "scope-roots: carry per-unit dependencyKeys in the manifest…"
  and `33bfd58` "validate: gate type comparisons on registry-file health…"). **Both are
  still reachable and both touch only `apps/api` resolvers and write-services** — neither
  touches `apps/media-worker`. They are ioc-manifest library-integration work, not worker
  scope-root work. Not the missing code.
- `git stash list` — **couldn't determine.** The command was denied by the permission layer
  in this session (twice). Running `git stash list` manually would settle it; given that
  the full source is recoverable from `d3ade10` and the removal is documented, a stash is
  unlikely to hold anything new.

---

## 4. Recovered source (Q3)

All quoted from `git show d3ade10:<path>` — the last commit where they existed, in full.

### 4.1 `mediaJobContext`

`apps/media-worker/src/infrastructure/database/mediaJobContext.ts`

```ts
import {
  MediaItemRepository,
  MediaProcessingJobRepository,
  UnitOfWork,
} from '@packages/media-core';
import { ScopeRoot } from 'ioc-manifest';

/**
 * Scope root for one media-image job phase. The runner opens this once per
 * transactional phase; everything reachable from `processNextMediaImageJob`
 * (the scoped domain repos) runs on the scope's own `uow` transaction.
 *
 * Empty lbv (arity-1 `ScopeRoot`): the worker has no viewer and nothing else
 * enters at the boundary — the actor id rides on the job row, not the scope.
 * The root settles its own transaction, so `start`/`finalize` delegate to `uow`.
 */
export interface MediaJobContext {
  mediaItemRepository: MediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  uow: UnitOfWork;
  start: () => Promise<void>;
  finalize: (ok: boolean) => Promise<void>;
}

type MediaJobContextDeps = {
  mediaItemRepository: MediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  uow: UnitOfWork;
};
export const build__MediaJobContext = ({
  mediaItemRepository,
  mediaProcessingJobRepository,
  uow,
}: MediaJobContextDeps): ScopeRoot<MediaJobContext> => ({
  mediaItemRepository,
  mediaProcessingJobRepository,
  uow,
  start: uow.begin,
  finalize: uow.complete,
});
```

- **Return annotation:** `ScopeRoot<MediaJobContext>` — **arity 1, no lbv type argument.**
- **Deps:** `mediaItemRepository`, `mediaProcessingJobRepository`, `uow`.
- **`ctx` shape:** `ctx.mediaItemRepository`, `ctx.mediaProcessingJobRepository`, `ctx.uow`,
  `ctx.start()`, `ctx.finalize(ok)`.

The local helper that bracketed it, `apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/inJobScope.ts`, in full:

```ts
import {
  MediaItemRepository,
  MediaProcessingJobRepository,
  UnitOfWork,
} from '@packages/media-core';
import { OpenMediaJobContextScope } from '../../../../generated/ioc-registry.types';

export interface InJobScope {
  <T>(fn: (ctx: MediaJobContext) => Promise<{ commit: boolean; value: T }>): Promise<T>;
}

export type MediaJobContext = {
  mediaItemRepository: MediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  uow: UnitOfWork;
  start: () => Promise<void>;
  finalize: (ok: boolean) => Promise<void>;
};

type InJobScopeDeps = {
  openMediaJobContextScope: OpenMediaJobContextScope;
};

// inJobScope.ts
export const build__InJobScope =
  ({ openMediaJobContextScope }: InJobScopeDeps): InJobScope =>
  async <T>(fn: (ctx: MediaJobContext) => Promise<{ commit: boolean; value: T }>): Promise<T> => {
    const { mediaJobContext: ctx, dispose } = openMediaJobContextScope();
    await ctx.start();
    try {
      const { commit, value } = await fn(ctx);
      await ctx.finalize(commit);
      return value;
    } catch (e) {
      await ctx.finalize(false);
      throw e;
    } finally {
      await dispose();
    }
  };
```

Note `inJobScope`'s signature: the callback returns `{ commit, value }` — **the callback
decides commit vs rollback by returning a flag**, not by throwing. That is the design
detail most worth preserving from this file.

**Consumer at `d3ade10` — `completeJobRow.ts`, in full:**

```ts
import { EntityId, MediaProcessingJobRow } from '@packages/media-core';
import { InJobScope } from './inJobScope';
import { PipelineResult } from './processNextMediaImageJob';

export type CompletionResult =
  | { outcome: 'completed' }
  | { outcome: 'notOwned'; message: string }
  | { outcome: 'itemGone'; message: string }
  | { outcome: 'applyFailed'; message: string };

export interface CompleteJobRow {
  (
    job: MediaProcessingJobRow,
    pipelineResult: PipelineResult,
    actorId: EntityId,
  ): Promise<CompletionResult>;
}

type CompleteJobRowDeps = {
  inJobScope: InJobScope;
};

export const build__CompleteJobRow =
  ({ inJobScope }: CompleteJobRowDeps): CompleteJobRow =>
  async (job, pipelineResult, actorId): Promise<CompletionResult> =>
    inJobScope(async (ctx): Promise<{ commit: boolean; value: CompletionResult }> => {
      // Job row first: WHERE status = PROCESSING is the ownership check. If the
      // stalled sweep reclaimed this job, we lose the race here and touch nothing.
      const claimed = await ctx.mediaProcessingJobRepository.markSucceeded(job.id, actorId);

      if (!claimed) {
        return {
          commit: false,
          value: {
            outcome: 'notOwned',
            message: `Job no longer owned — reclaimed or cancelled. jobId: ${job.id}`,
          },
        };
      }

      // Re-read inside the trx: the item read at claim time is stale by the
      // length of the pipeline.
      const item = await ctx.mediaItemRepository.getById(job.mediaItemId);
      if (!item) {
        return {
          commit: false,
          value: {
            outcome: 'itemGone',
            message: `Item deleted mid-pipeline — rolling back. jobId: ${job.id}`,
          },
        };
      }

      const applied = item.applyProcessingResults(pipelineResult, actorId);
      if (!applied.success) {
        return {
          commit: false,
          value: {
            outcome: 'applyFailed',
            message: `Could not apply results — rolled back, requeuing. jobId: ${job.id}, error: ${JSON.stringify(applied.error)}`,
          },
        };
      }

      await ctx.mediaItemRepository.save(item);
      return { commit: true, value: { outcome: 'completed' } };
    });
```

**And `recordJobFailure.ts` at `d3ade10`, in full:**

```ts
import { EntityId, MediaProcessingJobRow } from '@packages/media-core';
import { InJobScope } from './inJobScope';

export interface RecordJobFailure {
  (
    job: MediaProcessingJobRow,
    actorId: EntityId,
    message: string,
    retryable: boolean,
  ): Promise<void>;
}

type RecordJobFailureDeps = { inJobScope: InJobScope };

export const build__RecordJobFailure =
  ({ inJobScope }: RecordJobFailureDeps): RecordJobFailure =>
  async (job, actorId, message, retryable): Promise<void> =>
    inJobScope(async (ctx): Promise<{ commit: boolean; value: undefined }> => {
      // Retryable: the queue decides whether attempts remain. Non-retryable
      // goes terminal immediately, no cap consulted.
      const failItem = retryable
        ? (await ctx.mediaProcessingJobRepository.markPendingRetry(
            job.id,
            actorId,
            message,
            ctx.uow,
          )) === 'exhausted'
        : await ctx.mediaProcessingJobRepository.markFailed(job.id, actorId, message, ctx.uow);

      // Only fail the item if we actually owned the job — a false from either
      // write means the sweep reclaimed it and someone else is responsible.
      if (failItem) {
        const item = await ctx.mediaItemRepository.getById(job.mediaItemId);
        if (item) {
          item.markProcessingFailed(actorId);
          await ctx.mediaItemRepository.save(item);
        }
      }

      return { commit: true, value: undefined };
    });
```

Note both of these took `inJobScope` as their **only** dep — they were pure boundary-users.
Note also `markPendingRetry(job.id, actorId, message, ctx.uow)`: the repo took the uow as an
explicit **argument** back then, rather than injecting it.

### 4.2 `mediaDeletionJobContext`

`apps/media-worker/src/infrastructure/database/mediaDeletionJobContext.ts`

```ts
import { UnitOfWork } from '@packages/media-core';
import { ScopeRoot } from 'ioc-manifest';

import { ProcessNextMediaDeletionJob } from '../../tasks/queue/mediaWorkers/processNextMediaDeletionJob.js';

/**
 * Scope root for one media-deletion job phase — sibling of [[MediaJobContext]],
 * deliberately NOT merged with it: the two runners are independent trees and a
 * shared root would drag the image processor into every deletion scope.
 *
 * Empty lbv (arity-1 `ScopeRoot`): nothing enters at the boundary. The root
 * settles its own transaction, so `start`/`finalize` delegate to `uow`.
 */
export interface MediaDeletionJobContext {
  processNextMediaDeletionJob: ProcessNextMediaDeletionJob;
  start: () => Promise<void>;
  finalize: (ok: boolean) => Promise<void>;
}

type MediaDeletionJobContextDeps = {
  processNextMediaDeletionJob: ProcessNextMediaDeletionJob;
  uow: UnitOfWork;
};

export const build__MediaDeletionJobContext = ({
  processNextMediaDeletionJob,
  uow,
}: MediaDeletionJobContextDeps): ScopeRoot<MediaDeletionJobContext> => ({
  processNextMediaDeletionJob,
  start: uow.begin,
  finalize: uow.complete,
});
```

- **Return annotation:** `ScopeRoot<MediaDeletionJobContext>` — again arity 1.
- **Deps:** `processNextMediaDeletionJob`, `uow`.
- **`ctx` shape:** `ctx.processNextMediaDeletionJob` (the scoped processor, not a repo),
  `ctx.start()`, `ctx.finalize(ok)`. Note it did **not** expose `uow`.

**Consumer at `d3ade10` — `processNextMediaDeletionJob.ts`. The runner and its local
`inJobScope`, verbatim:**

```ts
export const build__RunNextMediaDeletionJob = ({
  openMediaDeletionJobContextScope,
  config,
  logger,
  mediaDeletionJobRepository,
  mediaStorage,
}: RunNextMediaDeletionJobDeps): RunNextMediaDeletionJob => {
  /**
   * One transactional phase: open the job scope, start its uow, run the work,
   * and settle the transaction exactly once — commit on return, roll back on
   * throw — before disposing the scope. Deliberately local to this runner (not
   * a shared util): the image runner keeps its own copy over its own root.
   */
  const inJobScope = async <T>(fn: (op: MediaDeletionJobContext) => Promise<T>): Promise<T> => {
    const { mediaDeletionJobContext, dispose } = openMediaDeletionJobContextScope();
    await mediaDeletionJobContext.start();
    try {
      const result = await fn(mediaDeletionJobContext);
      await mediaDeletionJobContext.finalize(true);
      return result;
    } catch (e) {
      await mediaDeletionJobContext.finalize(false);
      throw e;
    } finally {
      await dispose();
    }
  };

  return async (): Promise<ProcessNextMediaDeletionJobResult> => {
    const job = await mediaDeletionJobRepository.claimNextAvailableJob();
    if (!job) {
      return 'idle';
    }
    ...
    try {
      await deleteStorageObjects({ config, mediaStorage, logger, job });

      const rowDeleted = await inJobScope((op) =>
        op.processNextMediaDeletionJob.deleteMediaItemIfPresent(job.mediaItemId),
      );
      ...
```

Its deps type:

```ts
type RunNextMediaDeletionJobDeps = {
  openMediaDeletionJobContextScope: OpenMediaDeletionJobContextScope;
  config: Config;
  logger: Logger;
  mediaDeletionJobRepository: MediaDeletionJobRepository;
  mediaStorage: MediaStorage;
};
```

Note: **the deletion runner's local `inJobScope` used a different contract from the image
one** — `fn: (op) => Promise<T>` with commit-on-return / rollback-on-throw, no `{commit,
value}` flag. Two helpers, two shapes, both named `inJobScope`.

### 4.3 `emailDeliveryContext`

`apps/media-worker/src/infrastructure/database/emailDeliveryContext.ts`

```ts
import { EmailDeliveryRepository, UnitOfWork } from '@packages/media-core';
import { ScopeRoot } from 'ioc-manifest';

/**
 * Scope root for the batcher's per-send delivery-record write — sibling of
 * [[MediaJobContext]] and [[MediaDeletionJobContext]], kept separate for the
 * same reason: one root per tree, no shared bag of everything scoped.
 *
 * Empty lbv (arity-1 `ScopeRoot`): nothing enters at the boundary. The root
 * settles its own transaction, so `start`/`finalize` delegate to `uow`.
 */
export interface EmailDeliveryContext {
  emailDeliveryRepository: EmailDeliveryRepository;
  start: () => Promise<void>;
  finalize: (ok: boolean) => Promise<void>;
}

type EmailDeliveryContextDeps = {
  emailDeliveryRepository: EmailDeliveryRepository;
  uow: UnitOfWork;
};

export const build__EmailDeliveryContext = ({
  emailDeliveryRepository,
  uow,
}: EmailDeliveryContextDeps): ScopeRoot<EmailDeliveryContext> => ({
  emailDeliveryRepository,
  start: uow.begin,
  finalize: uow.complete,
});
```

- **Return annotation:** `ScopeRoot<EmailDeliveryContext>` — arity 1.
- **Deps:** `emailDeliveryRepository`, `uow`.
- **`ctx` shape:** `ctx.emailDeliveryRepository`, `ctx.start()`, `ctx.finalize(ok)`.

**Consumer at `d3ade10` — `notificationBatcher.ts`. The bracket and its use, verbatim:**

```ts
  /**
   * One transactional phase: open the delivery scope, start its uow, run the
   * work, and settle the transaction exactly once — commit on return, roll back
   * on throw — before disposing the scope. Deliberately local to this batcher
   * (not a shared util): the two queue runners keep their own copies.
   */
  const inDeliveryScope = async <T>(fn: (op: EmailDeliveryContext) => Promise<T>): Promise<T> => {
    const { emailDeliveryContext, dispose } = openEmailDeliveryContextScope();
    await emailDeliveryContext.start();
    try {
      const result = await fn(emailDeliveryContext);
      await emailDeliveryContext.finalize(true);
      return result;
    } catch (e) {
      await emailDeliveryContext.finalize(false);
      throw e;
    } finally {
      await dispose();
    }
  };
```

and its single call site:

```ts
        try {
          await inDeliveryScope((op) => op.emailDeliveryRepository.save(newEmailDelivery));
        } catch (e) {
          logger.error(
            '[notificationBatcher] delivery record insert failed — telemetry gap, not resending',
            { sesMessageId: r.value, error: e },
          );
        }
```

Its deps type — note the opener sitting where the commented-out ghost sits today:

```ts
type NotificationBatcherDeps = {
  logger: Logger;
  notificationService: NotificationService;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemUserRepository: SystemUserRepository;
  batchedEmailActivity: BatchedEmailActivity;
  openEmailDeliveryContextScope: OpenEmailDeliveryContextScope;
  config: Config;
};
```

---

## 5. What replaced them (Q4)

**Answer: the replacement landed one commit BEFORE the removal, not with it or after it.**

### The `settle(false)` per-task loop: `d3ade10`, 2026-08-28

> `building new uow lifecycle and methods`

`git log --all -S "settle(" ` and `-S "beginIsolatedOnly"` both name `d3ade10` as the
earliest commit. And at `d3ade10` the loop **already** carries the per-task settle:

```
$ git show d3ade10:apps/media-worker/src/runMediaWorkerLoop.ts | grep -n "settle\|uow"
27:  uow: UnitOfWork,
36:      await uow.settle(false);
38:      await uow.settle(false);
53:  uow: UnitOfWork,
59:      await uow.settle(false);
62:      await uow.settle(false);
77:  uow: UnitOfWork;
84:  uow,
111:        const didWork = await runWorkerTasksOnce(queueTasks, logger, uow);
117:        const sweepDidWork = await runAllTasks(sweepTasks, logger, uow);
```

At the previous commit `6a9c25e` the same file has **no `uow` reference at all**.

So the timeline is:

| | commit | date | what |
|---|---|---|---|
| 1 | `6a9c25e` | 2026-08-21 | scope roots **introduced** |
| 2 | `082e042` | 2026-08-26 | "fucked up mediaProcessing mess" (touches the same identifiers) |
| 3 | `d3ade10` | 2026-08-28 | `settle`/`beginIsolatedOnly` verbs added to `UnitOfWork`; loop gains `settle(false)` per task. **Scope roots still present.** They coexist for exactly this one commit. |
| 4 | `282b92b` | 2026-08-31 | scope roots **removed**; every consumer rewritten to `uow.join()`/`uow.complete()`; `withUnitOfWork.ts` deleted |

**Designed replacement, not drift.** The new lifecycle verbs were built first, then the
scope roots were cut over to them in one sweep. `282b92b` also refines the same
`unitOfWork.ts` it inherited from `d3ade10` (adds `reset()`, `publishPostCommit()`,
`openedAt` stack capture on `join()`, and turns the "settle resolving an open transaction"
log from `debug` to `warn` with the capture site attached — i.e. it deliberately made the
safety net *noisy* so a leaked boundary would be visible).

### The prose evidence, from `282b92b`'s `apps/media-worker/CLAUDE.md`

This is the strongest evidence of intent in the whole investigation. Added in the removal
commit, verbatim:

> ## Transactions — the loop is the safety net
>
> **Boundaries live in the unit that owns them.** `inJobScope` / `inDeliveryScope` /
> the per-job `*Context.ts` scope roots are **gone**; there is no `openXScope()` and
> no child scope anywhere in the worker. Every unit injects `uow` directly and brackets
> its own work:
>
> - `uow.join()` — attach to the open transaction, or lazily open one.
> - `uow.complete(ok)` — settle it; throws if none is open.
> - `uow.settle(ok)` — settle it if open, no-op otherwise. The forgiving verb, for
>   catch blocks and safety nets.
> - `uow.beginIsolatedOnly()` — demand a _fresh_ boundary, throw if one is already
>   open. Used only by the queue claim, which must commit independently.
>
> After **every** task run — success or throw — `runWorkerTasksOnce` / `runAllTasks`
> call `uow.settle(false)`. That is load-bearing, not belt-and-braces: see below.
>
> ### Everything here is a singleton, including the uow slot
>
> The worker's `ioc.config.ts` comments out `lifetimeMarkers`, so every worker-local
> unit is a **singleton**. `uow` comes from the composed media-core manifest, where it
> is `scoped` — but the worker creates exactly one container and never a child scope,
> so the scoped uow resolves once on the root and is, in practice, **one transaction
> slot for the whole process**.
>
> Consequences to keep in mind:
>
> - A task that leaves a transaction open would hand it to the _next_ task. The loop's
>   `settle(false)` after each run is what prevents that.
> - Two tasks can never run concurrently — the loop is strictly sequential — so the
>   single slot is safe. Do not add concurrency without giving each task its own scope.

The same commit's diff **removes** the old section that documented the scope roots:

> ```
> -## Scope roots (`src/infrastructure/database/*Context.ts`)
> -
> -Per-job transactional scopes are opened by **generated openers**, not by hand off the
> -root container. One `ScopeRoot` per runner tree — `MediaJobContext`,
> -`MediaDeletionJobContext`, `EmailDeliveryContext` — each an arity-1 `ScopeRoot<C>`
> ...
> -`withUnitOfWork` / `beginUnitOfWorkScope` are **not used in the worker** any more.
> ```

The author deleted the section describing the roots and wrote a replacement section
justifying their absence, in the same commit as the code deletion. **This was a decision,
recorded at the time.**

---

## 6. Boundary ownership, current state (Q5)

`rg -n "uow\.(join|settle|complete|beginIsolatedOnly)\(" -g '*.ts' -g '!**/generated/**'
-g '!**/tests/**' apps packages` → **140 call sites.**

### Verb totals

| verb | count |
|---|---|
| `uow.join(` | 98 |
| `uow.complete(` | 27 |
| `uow.settle(` | 14 |
| `uow.beginIsolatedOnly(` | 1 |

### By category

| category | count | notes |
|---|---|---|
| **Repository (leaf)** | **90** | `packages/context/{media-core,worker-core}/src/repositories/**` — 67 media-core, 23 worker-core |
| **Service / job processor** | **45** | `apps/media-worker/src/tasks/**` |
| **Scope root / context** | **0** in the worker | 3 in `apps/api` (`finalize: uow.settle`, see below) |
| **Loop / infrastructure** | **4** | `runMediaWorkerLoop.ts` — the four `uow.settle(false)` |
| **API service** | **1** | `apps/api/src/services/authService.ts:176 uow.complete(true)` |

### Verb breakdown *within* the repository layer — this is the answer to the question

| verb | count in repositories |
|---|---|
| `uow.join(` | **86** |
| `uow.complete(` | 2 |
| `uow.settle(` | 1 |
| `uow.beginIsolatedOnly(` | 1 |

**Yes — repositories call `uow.join()` themselves, 86 times, at the leaf.** The transaction
opens lazily wherever the first repository method happens to run. `join()` is
open-or-attach, so the *first* leaf to touch the DB creates the transaction and no unit
above it knows it did.

The four non-`join` repository calls are all in one file — `createJobQueueRepository.ts` —
and are the deliberate exception: the queue claim owns and ends its own isolated boundary.

**The ending is owned separately, in the task/service layer** (24 `complete`, 9 `settle`,
12 `join` across `apps/media-worker/src/tasks/**`). So it is not "no single unit owns the
ending" — it is a **split**: the *opening* is uncontrolled (any leaf), the *closing* is
explicit in the task, and the loop's `settle(false)` is the backstop for whatever the task
forgot. A task that reads through a repository but never calls `complete`/`settle` leaves
an open transaction that the loop then rolls back one task later.

### Representative call sites

**Repository — leaf opens the transaction. `packages/context/worker-core/src/repositories/domainRepositories/AggregateRepo.ts:74-77`:**

```ts
  return async (aggregate) => {
    await uow.join();
    await persistRecursion(aggregate);
  };
```

No `complete`, no `settle`, no ownership of the ending. This is the shape of 86 of the 90
repository call sites.

**Repository — the one deliberate self-owned boundary.
`packages/context/worker-core/src/repositories/createJobQueueRepository.ts:59-100`:**

```ts
  const claimNextAvailableJob = async (): Promise<TRow | undefined> => {
    // The claim owns its own boundary: FOR UPDATE SKIP LOCKED must commit
    // independently so the PROCESSING flip is visible to other workers before
    // the caller does any downstream work. begin() throws if a boundary is
    // already open — that's deliberate, this must never be a savepoint.
    await uow.beginIsolatedOnly();
    try {
      const selected = await uow.db()(table) ... .select<...>('id');
      const next = selected[0];
      if (!next) {
        await uow.complete(true);
        return undefined;
      }
      const updated = await withEnumRevival(...);
      await uow.complete(true);
      return updated[0] as TRow;
    } catch (e) {
      await uow.settle(false);
      throw e;
    }
  };
```

**Service / job processor — the unit owns the ending.
`apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/completeJobRow.ts:36-79`
— the direct descendant of the `inJobScope` version quoted in §4.1:**

```ts
  async (job, pipelineResult, actorId): Promise<CompletionResult> => {
    try {
      // Job row first: WHERE status = PROCESSING is the ownership check. If the
      // stalled sweep reclaimed this job, we lose the race here and touch nothing.
      await uow.join();
      const claimed = await mediaProcessingJobRepository.markSucceeded(job.id, actorId);

      if (!claimed) {
        await uow.complete(false);
        return { outcome: 'notOwned', message: `...` };
      }
      ...
      await mediaItemRepository.save(item);
      await uow.complete(true);
      return { outcome: 'completed' };
    } catch (e) {
      await uow.settle(false);
      throw e;
    }
  };
```

The `{ commit, value }` return flag from the old `inJobScope` contract became an explicit
`uow.complete(false)` before each early return. Same semantics, hand-rolled per branch —
four `complete` calls where there was previously one.

**Scope root — still alive, but only in the API.
`apps/api/src/graphql/context/requestContextFactories.ts:39-46`:**

```ts
}: AuthedDeps): ScopeRoot<AuthenticatedWriteScopeServices, { viewerId: EntityId }> => ({
  ...
  uow.flagRollbackOnly();
  ...
  finalize: uow.settle,
```

bracketed in `apps/api/src/graphql/server/useScopedContainer.ts:42-61`:

```ts
        const { authenticatedWriteGraphQlContext, dispose } =
          openAuthenticatedWriteGraphQlContextScope({ viewerId: ctx.viewer.id });
        ...
        return {
          async onExecuteDone({ result }) {
            ...
            await authenticatedWriteGraphQlContext.finalize(!result.errors?.length);
            await dispose();
          },
        };
```

The API still has exactly the pattern the worker gave up: one unit opens the scope,
brackets it, and owns `finalize`.

---

## 7. Sequentiality verdict (Q6)

**Verdict: job processing is strictly sequential. Every task is fully awaited before the
next is dispatched, and there is no `Promise.all`/`allSettled`/unawaited promise anywhere
on the DB path. The single process-lifetime uow is currently safe — by exactly one thread of
argument, with no mechanism enforcing it.**

`rg -n "Promise\.all|Promise\.allSettled|Promise\.race|void \(async|\.then\(" apps/media-worker/src`
(non-test) returns **two** hits, neither on the DB path:

```
apps/media-worker/src/attachGlobalHandlers.ts:14:      void shutdown().then(
apps/media-worker/src/tasks/queue/mediaWorkers/processMediaImage/runImageStoragePipeline.ts:51:    const [derivatives, capture] = await Promise.all([
```

The second is S3-download / derivative-generation / EXIF — the one unit the current
CLAUDE.md documents as having **no** DB boundary at all ("`runImageStoragePipeline` |
**none** — no DB at all"). It is `await`ed. The first is shutdown handling.

Notably, the batcher's old `await Promise.all(activityPayloads)` (§4.3's `d3ade10` version)
has since been converted to a sequential `for` loop, and its old
`Promise.all([deleteCompletedRecords, bumpRecordAttemptsByIds])` to two sequential awaits —
i.e. concurrency was actively removed to fit the single-slot uow.

**Dispatch site — `apps/media-worker/src/runMediaWorkerLoop.ts:22-64`, both segments:**

```ts
export const runWorkerTasksOnce = async (
  tasks: ReadonlyArray<WorkerTask>,
  logger: Logger,
  uow: UnitOfWork,
): Promise<boolean> => {
  if (tasks.length === 0) {
    return false;
  }
  for (const task of tasks) {
    let outcome: WorkerTaskOutcome;
    try {
      outcome = await task.run();
      await uow.settle(false);
    } catch (e) {
      await uow.settle(false);
      logger.error(`[mediaWorker-run_once] task "${task.name}" threw`, e);
      throw e;
    }
    if (outcome === 'processed') {
      return true;
    }
  }
  return false;
};

export const runAllTasks = async (
  tasks: ReadonlyArray<WorkerTask>,
  logger: Logger,
  uow: UnitOfWork,
): Promise<boolean> => {
  let didWork = false;
  for (const task of tasks) {
    try {
      const outcome = await task.run();
      await uow.settle(false);
      if (outcome === 'processed') didWork = true;
    } catch (e) {
      await uow.settle(false);
      logger.error(`[mediaWorker-run_all] task "${task.name}" threw`, e);
    }
  }
  return didWork;
};
```

**Loop body — `runMediaWorkerLoop.ts:88-140`:**

```ts
    while (!stopRequested) {
      try {
        // Two-phase pass. Queue tasks first, with restart-from-top preemption: run the
        // highest-priority due task, return on the first 'processed', and re-poll so the
        // lowest-order task always gets the next claim. Only when the queue reports idle
        // do due sweeps run — all of them, no early return, each stamping its own gate on
        // completion. This keeps a busy queue from consuming a sweep's interval slot
        // without ever firing it.
        const tasks = intervalGate.getTasksDue();
        const queueTasks = tasks.filter(isQueueTask);
        const sweepTasks = tasks.filter((t) => !isQueueTask(t));

        let didWork = false;
        try {
          didWork = await runWorkerTasksOnce(queueTasks, logger, uow);
        } catch {
          // Swallowed deliberately: runWorkerTasksOnce already logged the task name
          // and the error before rethrowing. ...
        }
        if (didWork) {
          idleCycles = 0;
          continue;
        }

        const sweepDidWork = await runAllTasks(sweepTasks, logger, uow);
        if (sweepDidWork) {
          idleCycles = 0;
          continue;
        }
        ...
        await sleep(config.mediaWorkerPollIntervalMs);
      } catch (e) {
        logger.error('Media worker loop error', e);
        await sleep(config.mediaWorkerPollIntervalMs);
      }
    }
```

`app.ts` starts the loop once (`const workerPromise = runMediaWorkerLoop.start()`) and
awaits it; there is no second loop instance and no per-job spawn. `intervalGate.getTasksDue()`
returns a plain sorted array; its only wrapper is a `.finally()` on scheduled tasks' `run`
to stamp `lastRun` — which does not introduce concurrency.

**The caveat worth stating:** sequentiality here is a property of how the loop happens to be
written, not something the type system or container enforces. The scope roots used to make
it structurally irrelevant — each phase had its own uow. Today, one `Promise.all` added
inside any task that touches the DB would silently interleave two logical transactions onto
the same slot.

---

## 8. Contradictions with the background premise

Six, ordered by how much they change the picture.

### 8.1 The removal predates the bounded-context split by six days and is unrelated to it

The prompt frames the loss as happening "before a bounded-context split that divided the old
`@packages/media-core` into `media-core` and a new `@packages/worker-core`" — leaving open
that the split caused it. It did not.

- Removal: `282b92b`, **2026-08-31**, on `main`'s lineage (merged into `main` via a
  fast-forward the same day per reflog: `282b92b HEAD@{2026-08-31 15:06:24}: merge @{-1}: Fast-forward`).
- Split: `1862e1b` "inital duplication or media-core" (2026-09-06), `7ba5d62` "worker-core
  split compiling" (2026-09-06), `0fb7320` "building and tests passing" (2026-09-08), all on
  `worker_core_split_out`.

By the time worker-core existed, there were no scope roots left to lose. The split
inherited the direct-`uow` design.

### 8.2 The removal was **deliberate and documented**, not incidental

The prompt says "The repo owner does not remember removing them." History says otherwise,
emphatically: same commit deleted the files, rewrote all consumers, deleted
`withUnitOfWork.ts`, and replaced the CLAUDE.md "Scope roots" section with a "Transactions —
the loop is the safety net" section explaining the new model and its constraints. The commit
*message* is silent (one line, no body) — so the memory gap is understandable — but the
change is not.

### 8.3 The `ScopeRoot` type argument in the prompt does not match what the worker used

The prompt's model is `ScopeRoot<TContract, TLbv>` with a declared lbv, e.g.
`ScopeRoot<RequestReport, { viewer: Viewer; uow: UnitOfWork }>`.

**All three worker scope roots were arity-1: `ScopeRoot<MediaJobContext>`,
`ScopeRoot<MediaDeletionJobContext>`, `ScopeRoot<EmailDeliveryContext>`.** Each carries a
doc comment saying so explicitly — "Empty lbv (arity-1 `ScopeRoot`): the worker has no
viewer and nothing else enters at the boundary". Their openers took **no arguments**:
`openMediaJobContextScope()`, not `openMediaJobContextScope({ viewer })`.

The two-argument form the prompt describes is real, but it is the **API's** shape:
`ScopeRoot<AuthenticatedWriteScopeServices, { viewerId: EntityId }>`. And `uow` was never in
an lbv anywhere — it is an ordinary scoped registration resolved as a sibling, per the
comment in `worker-core/src/ioc.config.ts`.

### 8.4 `runNextMediaDeletionJob` used a **local** `inJobScope`, not the shared one — and the two differed

The prompt describes "`runNextMediaDeletionJob` as already calling
`openMediaDeletionJobContextScope` for its row-delete phase, and described `completeJobRow`
and `recordJobFailure` as reaching their repo through `inJobScope → ctx.mediaProcessingJobRepository`."
Both halves are accurate — but they are **two different `inJobScope`s**:

- The image one (`processMediaImage/inJobScope.ts`) was a registered `build__InJobScope`
  contract; its callback returned `{ commit: boolean; value: T }`.
- The deletion one was a **closure defined inside `build__RunNextMediaDeletionJob`**, and
  its callback returned `Promise<T>` with commit-on-return / rollback-on-throw.
- The batcher had a third variant, `inDeliveryScope`, matching the deletion shape.

Each carried a comment saying the duplication was intentional ("Deliberately local to this
runner (not a shared util): the image runner keeps its own copy over its own root"). So
"the `inJobScope` pattern" was never one thing.

### 8.5 The `settle(false)` net is *not* what replaced the scope roots — it predates them being removed

The prompt asks whether the replacement lands "before, in, or after" removal, implying it
might be independent drift. It lands **before**, by one commit, in `d3ade10` — while the
scope roots were still fully in place. For that one commit both mechanisms were live
simultaneously. That is the opposite of drift: the net was built, then the roots were cut
over onto it.

### 8.6 Two small factual drifts in the current CLAUDE.md

Worth flagging since the doc is the only surviving record of the decision:

- It says "The worker's `ioc.config.ts` **comments out** `lifetimeMarkers`". Today
  `apps/media-worker/src/ioc.config.ts` has **no `lifetimeMarkers` block at all** — not
  commented, absent. Same practical effect (worker-local units default to singleton), but
  the doc describes a state that no longer literally exists.
- It says "`uow` comes from the composed **media-core** manifest". Post-split it comes from
  **worker-core** (`packages/context/worker-core/src/generated/ioc-manifest.ts:244-256`,
  `lifetime: 'scoped'`); the worker's `composedManifests` lists `@packages/worker-core`, not
  media-core.

### 8.7 Two dead references remain in the tree

Not contradictions, but cleanup the removal missed:

- `apps/media-worker/src/tasks/schedule/batchNotification/notificationBatcher.ts:25` —
  `// openEmailDeliveryContextScope: OpenEmailDeliveryContextScope;` commented out inside
  the live deps type.
- `packages/context/worker-core/src/ioc.config.ts:24` — a comment referring to
  `beginUnitOfWorkScope`'s `asValue`, a function deleted in `282b92b`.

---

## 9. Open / couldn't determine

- **`git stash list` was not run** — the permission layer denied the command twice in this
  session. Every other history read succeeded. Running `git stash list` (and
  `git stash show -p <n>` on anything present) would close this. Given the full source is
  recoverable from `d3ade10` and the removal is documented in-commit, a stash is unlikely
  to add anything, but it is the one stone left unturned.
