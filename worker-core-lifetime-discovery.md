# worker-core lifetime inversions — discovery report

Read-only investigation. No code changed, no codegen run, no tests run.

All file paths below were verified to exist. Where the prompt implied a path that does
not exist, the actual path is given.

---

## 1. Verdict on Q1

> **The worker never opens a scope. It resolves everything off the root container, once,
> for the life of the process — and that is not an oversight: it is a deliberate,
> load-bearing "one process-lifetime `uow`, settled between tasks" design, propped up by
> `strict: false` on the Awilix container.**

There is no `createScope()` anywhere in `apps/media-worker` or `packages/context/worker-core`:

```
$ grep -rn "createScope\|beginUnitOfWorkScope\|withUnitOfWork\|isLeakSafe" \
    apps/media-worker/src packages/context/worker-core/src --include="*.ts" | grep -v /generated/
apps/media-worker/src/container.ts:13:    strict: false,
packages/context/worker-core/src/ioc.config.ts:24:  // hand-registered onto each child scope (beginUnitOfWorkScope's asValue), which is
```

The only two hits are (a) the strict-mode flag and (b) a *comment* in worker-core's
`ioc.config.ts` referring to a `beginUnitOfWorkScope` that does not exist in this package.
Nothing is marked `isLeakSafe`.

### Composition root

`apps/media-worker/src/main.ts` — the whole bootstrap:

```ts
const bootstrap = async () => {
  dotenv.config();
  const container = createWorkerContainer(); // AwilixContainer<AppCradle>
  await container.cradle.app();
};

void bootstrap();
```

`apps/media-worker/src/container.ts` — the container, in full:

```ts
export const createWorkerContainer = (): AwilixContainer<AppCradle> => {
  const container = createContainer<AppCradle>();
  registerIocFromManifest(container, composedManifests, composedRegistrationOverrides, {
    strict: false,
  });
  return container;
};
```

`container.cradle.app()` is a **root** resolution. `app` (`apps/media-worker/src/app.ts`)
resolves `runMediaWorkerLoop` and `logMediaWorkerStartup` as constructor deps — also root —
and then just starts the loop:

```ts
export const build__App =
  ({ logger, database, runMediaWorkerLoop, logMediaWorkerStartup, attachGlobalHandlers }: AppDeps): App =>
  async () => {
    await logMediaWorkerStartup();
    const workerPromise = runMediaWorkerLoop.start();
    ...
  };
```

### `runMediaWorkerLoop` in full (the parts that matter)

`apps/media-worker/src/runMediaWorkerLoop.ts:71-155`:

```ts
type RunMediaWorkerLoopDeps = {
  config: Config;
  logger: Logger;
  intervalGate: IntervalGate;
  uow: UnitOfWork;
};

export const build__RunMediaWorkerLoop = ({
  config,
  logger,
  intervalGate,
  uow,
}: RunMediaWorkerLoopDeps): RunMediaWorkerLoop => {
  let running = false;
  let stopRequested = false;
  const start = async (): Promise<void> => {
    ...
    while (!stopRequested) {
      try {
        const tasks = intervalGate.getTasksDue();
        const queueTasks = tasks.filter(isQueueTask);
        const sweepTasks = tasks.filter((t) => !isQueueTask(t));

        let didWork = false;
        try {
          didWork = await runWorkerTasksOnce(queueTasks, logger, uow);
        } catch { /* ... */ }
        if (didWork) { idleCycles = 0; continue; }

        const sweepDidWork = await runAllTasks(sweepTasks, logger, uow);
        ...
```

**Answers to the three sub-questions:**

- **Scope per iteration?** No. `start()` closes over the four deps captured at construction
  and loops forever. `intervalGate.getTasksDue()` returns the *same task instances* every
  pass — `intervalGate` itself (`apps/media-worker/src/intervalGate.ts:34`) does
  `const allTasks: readonly WorkerTask[] = workerTasks;` once at construction and only
  re-filters/re-sorts that fixed array. There is no cradle access anywhere in the loop.

- **Where does `uow` come from?** Root resolution, resolved once when `runMediaWorkerLoop`
  itself is constructed as a dep of `app`.

- **What is the `uow` actually used for in the loop?** Not work — **leak cleanup**. It is
  passed to the two task drivers, which use it only to force the transaction closed after
  every single task (`runMediaWorkerLoop.ts:24-66`):

  ```ts
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
    if (outcome === 'processed') { return true; }
  }
  ```

  This is the mechanism that substitutes for a per-job scope: one `uow` object exists for
  the whole process, and the loop guarantees it is drained between tasks. That guarantee is
  load-bearing, because the queue claim path throws if a transaction is already open —
  `packages/context/worker-core/src/repositories/createJobQueueRepository.ts:59-64`:

  ```ts
  const claimNextAvailableJob = async (): Promise<TRow | undefined> => {
    // The claim owns its own boundary: FOR UPDATE SKIP LOCKED must commit
    // independently ... begin() throws if a boundary is
    // already open — that's deliberate, this must never be a savepoint.
    await uow.beginIsolatedOnly();
  ```

  and `beginIsolatedOnly` (`packages/context/worker-core/src/infrastructure/repositories/unitOfWork.ts:55-61`)
  does exactly that:

  ```ts
  beginIsolatedOnly: async () => {
    if (trx) {
      throw new Error(`[uow:${id}] Transaction already active when beginIsolatedOnly called`);
    }
    trx = await database.transaction();
  ```

### Why it runs today: `strict: false`

The 34 codegen errors are the *build-time mirror* of a runtime check that
`container.ts:13` explicitly turns off. From `node_modules/awilix/lib/awilix.module.mjs:1629-1673`:

```js
function throwIfLifetimeLeakage(depName, depLifetime, dep) {
    if (!options.strict || dep.isLeakSafe)
        return;
    for (let i = 0; i < resolutionStack.length; i++) {
        if (isLifetimeLonger(resolutionStack[i].lifetime, depLifetime)) {
            throw new AwilixResolutionError(depName, resolutionStack,
              `Dependency '${depName}' has a shorter lifetime than its ancestor: '${resolutionStack[i].name}'`);
        }
    }
}
...
case Lifetime.SCOPED:
    resolved = resolver.resolve(container);
    container.cache.set(name, { resolver, value: resolved });
```

With `strict: false`, `throwIfLifetimeLeakage` short-circuits, and `SCOPED` resolves
against `container` — which here *is* the root — and caches on the root's cache. So every
`scoped` worker-core unit (`uow` and all nine repos) is, at runtime today, a **process-wide
singleton cached on the root container**. Flipping `strict: true` would make all 34 edges
throw at first resolution.

---

## 2. The 16 consumers

Source of truth: `apps/media-worker/src/generated/ioc-manifest.ts`. Every one of the 31
registrations in that manifest reads `lifetime: 'singleton'` / `lifetimeSource: 'default'`:

```
$ grep -c "lifetime: 'singleton'" apps/media-worker/src/generated/ioc-manifest.ts
31
$ grep -n "lifetime: '" apps/media-worker/src/generated/ioc-manifest.ts | grep -v singleton
(no output)
$ grep -o "lifetimeSource: '[a-zA-Z]*'" apps/media-worker/src/generated/ioc-manifest.ts | sort | uniq -c
     31 lifetimeSource: 'default'
```

**Grouping by *how* they got their lifetime — there are only two buckets, and both reduce
to the same cause:**

| # | Consumer | Declared lifetime | Where declared | Inherited from a base? | Is `singleton` correct for it? |
|---|---|---|---|---|---|
| 1 | `runMediaWorkerLoop` | singleton | nowhere — codegen default | no (plain `type RunMediaWorkerLoop`) | **Yes.** One loop per process is the point. |
| 2 | `logMediaWorkerStartup` | singleton | nowhere — codegen default | no (plain `interface LogMediaWorkerStartup`) | **Yes.** Runs exactly once, before the loop. |
| 3 | `applyEmailDeliveryEvents` | singleton | nowhere — codegen default | **yes — `extends WorkerJobProcessorBase`**, but the marker is unmapped, so it falls through to default | Debatable — see note below |
| 4 | `claimJobRow` | singleton | nowhere — codegen default | no | Debatable |
| 5 | `completeJobRow` | singleton | nowhere — codegen default | no | Debatable |
| 6 | `recordJobFailure` | singleton | nowhere — codegen default | no | Debatable |
| 7 | `processNextMediaDeletionJob` | singleton | nowhere — codegen default | **yes — `extends WorkerJobProcessorBase`**, unmapped → default | Debatable |
| 8 | `runNextMediaDeletionJob` | singleton | nowhere — codegen default | no (plain `type` alias) | Debatable |
| 9 | `stalledMediaJobSweep` | singleton | nowhere — codegen default | no (plain `type` alias) | Debatable |
| 10 | `notificationBatcher` | singleton | nowhere — codegen default | no (plain `type` alias) | Debatable |
| 11 | `fastSweepNotification` | singleton | nowhere — codegen default | no (plain `type` alias) | Debatable |
| 12 | `albumActivity` | singleton | nowhere — codegen default | yes — `extends BatchedEmailPayload`, but that is a **group** base with no lifetime mapping | Debatable |
| 13 | `commentActivity` | singleton | nowhere — codegen default | same (group base only) | Debatable |
| 14 | `reactionActivity` | singleton | nowhere — codegen default | same (group base only) | Debatable |
| 15 | `albumSharedStrategy` | singleton | nowhere — codegen default | returns `FastSweepNotificationStrategy<'memberAlbumShared'>` — group base, no lifetime mapping | Debatable |
| 16 | `albumSharedWithNonUserStrategy` | singleton | nowhere — codegen default | returns `FastSweepNotificationStrategy<'guestAlbumShared'>` — same | Debatable |

### The important negative result for Q2

**Not one of the 16 inherits its lifetime from a lifecycle marker.** The
`AgnosticReadServiceBase`-shaped bug you are looking for is not what is happening here.
All 16 are `lifetimeSource: 'default'` because **`apps/media-worker/src/ioc.config.ts` maps
no lifetime markers at all**:

```ts
export default defineIocConfig({
  discovery: { ... factoryPrefix: 'build__' },
  composedManifests: ['@packages/worker-core', '@packages/infrastructure', '@packages/notifications'],

  registrations: {
    Knex: { $contract: { accessKey: 'database' } },
  },
  groups: { workerTasks: {...}, fastSweepNotificationStrategies: {...}, batchedEmailActivity: {...} },
});
```

There is no `lifetimeMarkers` key. Two of the sixteen (`applyEmailDeliveryEvents`,
`processNextMediaDeletionJob`) *do* extend `WorkerJobProcessorBase`, the marker the root
`CLAUDE.md` documents as `→ scoped` — but the mapping that would give it meaning was
commented out and then deleted (see Q7). A marker with no mapping is inert.

So there is no single base to fix. **The 16 are singletons because the worker app declares
no scoped anything.** Correspondingly, the *entire* asymmetry lives on the other side of
the boundary: worker-core declares nine repos + `uow` scoped, and the app that consumes
them declares nothing scoped and never opens a scope.

**Note on "is `singleton` correct":** for #1 and #2 it plainly is. For #3–#16 the honest
answer is *the question is malformed under the current design* — these units hold no
per-job state, and the shared `uow` between them is exactly what makes tasks like
`runNextMediaDeletionJob` → `processNextMediaDeletionJob` (below) work. Making them scoped
without introducing a scope-opener would change nothing at runtime and would only move the
inversion up one level to whoever resolves them.

---

## 3. worker-core declarations

Source: `packages/context/worker-core/src/generated/ioc-manifest.ts`.

| Unit | Lifetime | `lifetimeSource` | Declared where | Deliberate, or carried over? |
|---|---|---|---|---|
| `uow` (contract `UnitOfWork`) | scoped | `lifetime-marker` | `interface UnitOfWork extends RequestScopeLifeCycle` in `infrastructure/repositories/unitOfWork.ts:5` + `RequestScopeLifeCycle: 'scoped'` in worker-core `ioc.config.ts:36` | **Carried over** (heritage byte-identical to pre-split media-core) |
| `emailDeliveryRepository` | scoped | `lifetime-marker` | `interface EmailDeliveryRepository extends RequestScopeLifeCycle` | Carried over, unmodified |
| `mediaProcessingJobRepository` | scoped | `lifetime-marker` | `extends RequestScopeLifeCycle` | Carried over, unmodified |
| `mediaItemRepository` | scoped | `lifetime-marker` | `extends RequestScopeLifeCycle` | Carried over, unmodified |
| `mediaDeletionJobRepository` | scoped | `lifetime-marker` | `extends RequestScopeLifeCycle` | Carried over, unmodified |
| `systemMediaItemRepository` | scoped | `lifetime-marker` | `extends RequestScopeLifeCycle` | Carried over, unmodified |
| `systemUserRepository` | scoped | `lifetime-marker` | `extends RequestScopeLifeCycle` | Carried over, unmodified |
| `systemCommentRepository` | scoped | `lifetime-marker` | `extends RequestScopeLifeCycle` | Carried over, unmodified |
| `systemAlbumRepository` | scoped | `lifetime-marker` | `extends RequestScopeLifeCycle` | Carried over, unmodified |
| `systemAsyncNotificationRepository` | scoped | `lifetime-marker` | `extends RequestScopeLifeCycle` | Carried over, unmodified |
| `systemAuthorizationRepository` | scoped | `lifetime-marker` | `extends RequestScopeLifeCycle` | Carried over, unmodified |
| `persist` (contract `Persist`) | scoped | `lifetime-marker` | `interface Persist extends RequestScopeLifeCycle` | Carried over, unmodified |
| `mediaStorage` | **singleton** | `default` | nowhere | n/a — the one non-scoped unit in worker-core |

The `uow` key name (not its lifetime) is the only thing worker-core's `ioc.config.ts`
touches:

```ts
registrations: {
  UnitOfWork: {
    // ... Lifetime is left to the RequestScopeLifeCycle heritage marker → scoped.
    $contract: { accessKey: 'uow' },
    unitOfWork: { name: 'uow' },
  },
},
lifetimeMarkers: {
  RequestScopeLifeCycle: 'scoped',
},
```

### Evidence that `scoped` was carried over, not chosen

The generated `ioc-manifest.ts` files are **not tracked in git** (`git ls-tree -r --name-only
e311e2a | grep generated/ioc` → empty; so does `git ls-files`), so the manifests cannot be
diffed historically. Instead I diffed the *source* of the lifetime declaration — the
`extends` clause — between the pre-split media-core files at `e311e2a` and the worker-core
copies at `HEAD`:

```
### repositories/systemRepositories/systemAlbumRepository.ts
  PRE : export interface SystemAlbumRepository extends RequestScopeLifeCycle {
  POST: export interface SystemAlbumRepository extends RequestScopeLifeCycle {
### repositories/systemRepositories/systemAsyncNotificationRepository.ts
  PRE : export interface SystemAsyncNotificationRepository extends RequestScopeLifeCycle {
  POST: export interface SystemAsyncNotificationRepository extends RequestScopeLifeCycle {
### repositories/systemRepositories/systemAuthorizationRepository.ts   → identical
### repositories/systemRepositories/systemCommentRepository.ts         → identical
### repositories/systemRepositories/systemMediaItemRepository.ts       → identical
### repositories/systemRepositories/systemUserRepository.ts            → identical
### repositories/domainRepositories/emailDeliverRepository.ts          → identical
### repositories/domainRepositories/mediaItemRepository.ts             → identical
### repositories/domainRepositories/AggregateRepo.ts (Persist)         → identical
### repositories/mediaDeletionJob/mediaDeletionJobRepository.ts        → identical
### repositories/mediaProcessingJob/mediaProcessingJobRepository.ts    → identical
```

**Zero heritage changes across the split.** Every one of these files has other diffs
(method bodies, imports, 4–83 changed lines each) — they were actively edited — but nobody
touched the lifetime declaration on any of them. `scoped` is inherited from media-core's
request-per-GraphQL-operation model verbatim.

For comparison, the current media-core manifest shows the same repos at the same lifetime,
so this is a straight copy, not a divergence:

```
mediaItemRepository                  scoped   lifetime-marker
mediaProcessingJobRepository         scoped   lifetime-marker
persist                              scoped   lifetime-marker
systemAsyncNotificationRepository    scoped   lifetime-marker
systemAuthorizationRepository        scoped   lifetime-marker
systemCommentRepository              scoped   lifetime-marker
systemMediaItemRepository            scoped   lifetime-marker
systemUserRepository                 scoped   lifetime-marker
uow                                  scoped   lifetime-marker
```

**Aside worth flagging:** the root `CLAUDE.md` repository-taxonomy table says System repos
are *"singleton, raw `database`, no UoW"*. That is not what the code does — in both
media-core and worker-core every `System*Repository` is **scoped and takes `uow`**, e.g.
`packages/context/worker-core/src/repositories/systemRepositories/systemAlbumRepository.ts`:

```ts
type SystemAlbumRepositoryDeps = { uow: UnitOfWork; };

export const build__SystemAlbumRepository = ({ uow }: SystemAlbumRepositoryDeps): SystemAlbumRepository => ({
  getAlbumTitlesById: async (albumIds: EntityId[]) => {
    await uow.join();
    return uow.db()('album').modify(withAlbumItemCount(uow.db())) ...
```

The doc is stale. Anyone reasoning from that table about "System repos don't need a scope"
will reach the wrong conclusion.

---

## 4. UnitOfWork findings (Q4)

The intended design — `db()`, `join()`, `settle()`, **no event queue** — is *partly* what
exists. The event queue is genuinely gone. Everything else is a verbatim copy of
media-core's, including a method whose only documented caller is the GraphQL write boundary
that does not exist in the worker.

`packages/context/worker-core/src/infrastructure/repositories/unitOfWork.ts:5-20`, the
complete method surface:

```ts
export interface UnitOfWork extends RequestScopeLifeCycle {
  id: string;
  beginIsolatedOnly: () => Promise<void>;
  join: () => Promise<void>;
  db: () => Knex.Transaction;
  complete: (ok: boolean) => Promise<void>;
  settle: (ok: boolean) => Promise<void>;
  /**
   * Set by the GraphQL write boundary when a mutation field returns a failed
   * OperationResult (fail-as-data). ...
   */
  flagRollbackOnly: () => void;
}
```

- **Does `settle()`/`complete()` touch an event publisher or drain an event queue?** **No.**
  Both funnel into `completeTransaction`, which is now purely commit-or-rollback:

  ```ts
  const completeTransaction = async (ok: boolean) => {
    if (!trx) return;
    const t = trx;
    try {
      if (!ok || shouldRollback) {
        await t.rollback();
        logger.debug(`[uow:${id}] rolled back (${shouldRollback ? 'flagged' : 'failed'})`);
        return;
      }
      await t.commit();
      logger.debug(`[uow:${id}] committed`);
    } finally {
      reset();
    }
  };
  ```

- **Does it differ from media-core's, or is it a copy under a new name?** It is
  **media-core's file with the event machinery excised, and nothing else changed.** 83 diff
  lines against `e311e2a:packages/context/media-core/src/infrastructure/repositories/unitOfWork.ts`,
  and every one of them is event-related. What was removed:
  - imports of `DomainEvent` and `EventPublisher`
  - `eventPublisher` from `UnitOfWorkDeps`
  - `collectEvents(events: DomainEvent[]): void` from the interface
  - the `let events: DomainEvent[] = []` buffer and its clear in `reset()`
  - the whole 20-line `publishPostCommit()` helper and its call site inside `completeTransaction`

  Everything else — `id`, `beginIsolatedOnly`, `join`, `db`, `complete`, `settle`,
  `flagRollbackOnly`, the `openedAt` stack capture, the `settle` warn-and-recover path, the
  `crypto.randomUUID()` id — is character-identical to media-core's.

- **Residue worth noting:** `flagRollbackOnly` survived the copy with its media-core
  docstring intact ("Set by the GraphQL write boundary…", "the uow is per-request"). No
  production code in `apps/media-worker` or `packages/context/worker-core` calls it — the only
  hits are test stubs and worker-core's own `unitOfWork.tests.ts`. It, and its
  `shouldRollback` branch, are dead in the worker context. The docstring is also now
  actively misleading: in the worker the uow is emphatically *not* per-request; it is
  per-process.

---

## 5. Group findings (Q5)

Both group keys confirmed, from `apps/media-worker/src/ioc.config.ts:31-47`:

```ts
groups: {
  workerTasks:                     { kind: 'collection', baseType: 'WorkerTaskBase' },
  fastSweepNotificationStrategies: { kind: 'collection', baseType: 'FastSweepNotificationStrategy',
                                     baseTypeArg: 'TemplateName' },
  batchedEmailActivity:            { kind: 'collection', baseType: 'BatchedEmailPayload' },
},
```

So it is **two** groups, not one:

- `batchedEmailActivity` (base `BatchedEmailPayload`, `batchedPayloads/types.ts:6`) →
  `albumActivity`, `commentActivity`, `reactionActivity`
- `fastSweepNotificationStrategies` (base `FastSweepNotificationStrategy<T>`,
  `fastSweepNotificationStrategies/types.ts:19`) → `albumSharedStrategy`,
  `albumSharedWithNonUserStrategy`

### Both consumers hold member *instances*, injected once at construction

**`notificationBatcher`** (`apps/media-worker/src/tasks/schedule/batchNotification/notificationBatcher.ts:19-72`):

```ts
type NotificationBatcherDeps = {
  logger: Logger;
  notificationService: NotificationService;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemUserRepository: SystemUserRepository;
  batchedEmailActivity: BatchedEmailActivity;
  config: Config;
  uow: UnitOfWork;
  emailDeliveryRepository: EmailDeliveryRepository;
};

export const build__NotificationBatcher = ({ ..., batchedEmailActivity, ..., uow, ... }) => {
  return async (): Promise<WorkerTaskOutcome> => {
    await uow.join();
    const rows = await systemAsyncNotificationRepository.claimNotificationBatch(...);
    ...
    const payloads: ActivityResult[] = [];
    for (const activity of batchedEmailActivity) {
      payloads.push(await activity.execute(candidates));
    }
```

**`fastSweepNotification`** (`apps/media-worker/src/tasks/schedule/individualNotification/fastSweepNotification.ts:30-81`):

```ts
export const build__FastSweepNotification = ({ ..., fastSweepNotificationStrategies, uow, ... }) => {
  ...
  return async (): Promise<WorkerTaskOutcome> => {
    await uow.join();
    const rows = await systemAsyncNotificationRepository.claimIndividualNotifications(...);
    ...
    for (const [kind, kindRows] of byKind) {
      const strategy = fastSweepNotificationStrategies.find((s) => s.kind.value === kind);
      if (!strategy) { ...; continue; }
      results.push(await strategy.execute(kindRows, userMap));
    }
    await uow.complete(true);
```

Neither consumer ever touches a cradle. `batchedEmailActivity` and
`fastSweepNotificationStrategies` are plain arrays of already-constructed members, captured
in the closure at construction time — **injected once, iterated per call**. There is no
resolve-by-key path in either.

### "These five depend on repos but not on `uow`" — is it meaningful?

**Yes, and not in the reassuring direction. They are not doing untransactional reads —
they are inheriting the caller's open transaction through a shared singleton, implicitly.**

`albumActivity`'s only dep is `systemAlbumRepository`
(`batchedPayloads/albumActivity.ts:18-31`):

```ts
type AlbumActivityDeps = { systemAlbumRepository: SystemAlbumRepository; };

export const build__AlbumActivity = ({ systemAlbumRepository }: AlbumActivityDeps): AlbumActivity => ({
  execute: async (rows): Promise<ActivityResult> => {
    ...
    const titleMap = indexBy(await systemAlbumRepository.getAlbumTitlesById(albumIds));
```

and `getAlbumTitlesById` opens or joins a transaction *on the uow*:

```ts
getAlbumTitlesById: async (albumIds: EntityId[]) => {
  await uow.join();
  return uow.db()('album').modify(withAlbumItemCount(uow.db())) ...
```

Sequence today: `notificationBatcher` calls `uow.join()` → opens trx T on the one process
uow → calls `activity.execute(...)` → `systemAlbumRepository.getAlbumTitlesById` calls
`uow.join()` → **same singleton uow**, sees `trx` already set, no-ops → the read runs inside
T. The strategy is transactionally consistent with its caller **only because every
participant resolves the same root-cached `uow` instance.**

That is the single most important consequence for any fix: **introducing a per-job scope
without also threading `uow` (or the scope) into these five members will silently split
them onto a different transaction from their caller.** The absence of a `uow` dep on these
five is not evidence that they are transaction-free; it is evidence of an undeclared
dependency that root resolution currently satisfies by accident of caching.

The identical pattern exists outside the groups: `processNextMediaDeletionJob` takes only
`mediaItemRepository` (no `uow`), while its caller `runNextMediaDeletionJob` wraps the call
in `await uow.join()` / `await uow.complete(true)` (`processNextMediaDeletionJob.ts:107-131`).
Same coupling, same exposure.

---

## 6. Q6 — `logMediaWorkerStartup`

File: `apps/media-worker/src/tasks/queue/mediaWorkers/logMediaWorkerStartup.ts` (not at the
top level of `src/` as the layout might suggest).

**The `uow` is not vestigial. It does real database work** — it is the Postgres
connectivity preflight (`:32-49`):

```ts
try {
  await uow.join();
  await uow.db().raw('select 1 as ok');
  await uow.complete(true);
  logger.info('Postgres connectivity check succeeded', {
    host: config.postgresHost, port: config.postgresPort, database: config.postgresDatabase,
  });
} catch (e) {
  await uow.settle(false);
  logger.error('Postgres connectivity check failed', e, { ... });
  throw e;
}
```

It is a fail-fast startup gate: `app.ts` awaits `logMediaWorkerStartup()` before
`runMediaWorkerLoop.start()`, and this `throw` aborts the process rather than letting the
loop spin against a dead database. There is a matching S3 `HeadBucketCommand` check right
after it.

**It could not simply be dropped.** It could reasonably be *narrowed* — a raw
`database.raw('select 1')` on the singleton Knex needs no transaction and no `uow` at all,
which would remove one of the 34 edges with zero behavioural change. But as written the
dependency is used, not decorative.

---

## 7. Q7 — Pre-existing vs. new

**Pre-existing. The split did not create a single one of these 34 edges.** Three
independent lines of evidence:

**(a) The worker's lifetime markers were already dead before the split.** The pre-split
`apps/media-worker/src/ioc.config.ts` at `e311e2a`:

```ts
  lifetimeMarkers: {
    // RequestScopeLifeCycle: 'scoped',
    // WorkerJobProcessorBase: 'scoped',
  },
```

Both commented out. `git log -S "WorkerJobProcessorBase: 'scoped'" -- apps/media-worker/src/ioc.config.ts`
returns `cd05181 fixing up media-worker to work with the uow` (added) and `7ba5d62 worker-core
split compiling` (removed) — so they were live at `cd05181`, commented out at some point
before `e311e2a`, and the split merely deleted the now-empty block. The full split diff on
that file:

```diff
   composedManifests: [
-    '@packages/media-core',
+    '@packages/worker-core',
     '@packages/infrastructure',
     '@packages/notifications',
   ],
-  lifetimeMarkers: {
-    // RequestScopeLifeCycle: 'scoped',
-    // WorkerJobProcessorBase: 'scoped',
-  },
 
   registrations: {
     Knex: {
       $contract: { accessKey: 'database' },
     },
-    EventPublisher: {
-      noopEventPublisher: { name: 'noopEventPublisher', default: true },
-    },
   },
```

An empty-object `lifetimeMarkers` and an absent one produce the same discovery result, so
all 16 consumers were `lifetimeSource: 'default'` singletons before the split too.

**(b) The scoped side was already scoped.** Section 3 above: all eleven
`extends RequestScopeLifeCycle` clauses are byte-identical pre- and post-split.

**(c) The consumers themselves were not re-declared.** `git diff e311e2a..HEAD` on the five
group members changes nothing but the import specifier:

```diff
-import { AsyncNotification, SystemAlbumRepository } from '@packages/media-core';
+import { AsyncNotification, SystemAlbumRepository } from '@packages/worker-core';
```

(same shape for `commentActivity`, `reactionActivity`, `albumSharedStrategy`,
`albumSharedWithNonUserStrategy`, `runMediaWorkerLoop`, `logMediaWorkerStartup`,
`claimJobRow`, `stalledMediaJobSweep`, `processNextMediaDeletionJob`,
`applyEmailDeliveryEvents` — 2–4 line diffs, all import-path swaps).

So: singleton consumers pointed at scoped `@packages/media-core` repos before, and point at
scoped `@packages/worker-core` repos now. **The 4.1.0 upgrade is what made them visible**,
exactly as the prompt's framing suspected — the split just changed which package name
appears in the error text.

*Caveat I cannot close:* I could not directly verify the 4.1.0 `externalKeys` /
composed-group-member gap, because the generated manifests are untracked and I did not run
`ioc inspect` (read-only, but out of scope here) or install a 4.0.x to compare. The
`node_modules/ioc-manifest/README.md` has no mention of "inversion", "externalKeys", or
"composed group". **What would settle it:** `npm view ioc-manifest@4.1.0` release notes, or
running `npx ioc validate` under a temporarily pinned 4.0.x in a scratch checkout. The
source-level evidence above is nonetheless conclusive that the *edges* pre-date the split,
independent of which release started reporting them.

---

## 8. Things that contradict the framing above

> *"The premise of this investigation is that the worker resolves at root and needs a scope
> per job."*

The first half is confirmed. **The second half is where I would push back.**

**(1) The worker has an explicit, coherent alternative to a per-job scope, and it is
already wired.** One process-lifetime `uow`, forcibly drained by
`await uow.settle(false)` after *every* task in both `runWorkerTasksOnce` and `runAllTasks`,
with `beginIsolatedOnly()` throwing if anything left a boundary open. That is a
substitute for scope disposal, and the `settle` call sites read as deliberate design, not
accident. `runMediaWorkerLoop`'s `uow` dep — one of the 34 edges — exists *solely* to
implement that cleanup. A per-job scope would make that dependency disappear, and would
also make the `settle` calls redundant. This is a genuine architectural fork, not a bug
fix, and "add a scope per job" silently deletes the current mechanism.

**(2) The 34 edges are not the freeze bug the root `CLAUDE.md` describes.** That doc warns
that "a singleton that depends on a scoped dep freezes it — captures the first-resolved
instance and reuses it across all scopes forever." Here **there are no other scopes**. The
frozen instance is the *only* instance, by construction, and the loop resets it between
tasks. The dangerous version of the freeze bug — instance leaking *across* scopes — cannot
occur in a process that never creates a second scope. What codegen is reporting is a
well-formedness violation, not (yet) a live defect.

**(3) The fix cannot be made at one base class.** Q2's hypothesis (an accidental
lifecycle marker on a shared base, à la `AgnosticReadServiceBase`) does not hold: **all 16
consumers are `lifetimeSource: 'default'`, inheriting nothing.** Conversely, all twelve
scoped worker-core units *do* share one marker (`RequestScopeLifeCycle`), so if there is a
single-point fix, it is on the **worker-core** side, not the app side — and it points the
opposite direction from the prompt's framing: rather than making the worker scoped, one
could make worker-core's repos singleton (they hold no per-request state; the worker has no
viewer, no request, no per-scope injected values — `IOC_SCOPE_PROVIDED_KEYS` in
worker-core's manifest is literally `[]`, versus media-core's `['publicLinkId', 'viewerId']`).

**(4) There is a hidden coupling that either fix must handle.** Five group members plus
`processNextMediaDeletionJob` depend on repos but *not* on `uow`, and rely on their caller's
`uow.join()` having opened a transaction on the shared instance (Section 5). Any change
that gives them a different `uow` than their caller — which is precisely what a naive
per-job scope with these units still resolved at root would do — splits them onto a separate
transaction, silently. Nothing in the type system catches it; a test that asserts "the
strategy's read sees the batcher's uncommitted claim" would.

**(5) `strict: false` in `container.ts` is the load-bearing runtime counterpart.** The
codegen error and the awilix runtime check are the same check. Whatever fix lands, the
honest acceptance test is "does the worker still boot with `strict: true`?" — not "does
codegen pass?".

**(6) Two documentation/dead-code corrections found along the way**, neither of which
changes the fix but both of which will mislead the next reader:
- root `CLAUDE.md`'s repository-taxonomy table says System repos are singletons on raw
  `database` with no UoW. In both contexts they are scoped and take `uow`.
- `worker-core`'s `ioc.config.ts:24` comment refers to `beginUnitOfWorkScope`'s `asValue`
  and says "Scope roots open the scope now" — there is no scope root and no
  `beginUnitOfWorkScope` in worker-core or media-worker. Copied from media-core.
- `UnitOfWork.flagRollbackOnly` has no production caller in the worker (only test stubs),
  and its docstring describes a GraphQL boundary that does not exist there.

---

## Appendix — verified paths

| Thing | Actual path |
|---|---|
| Worker loop | `apps/media-worker/src/runMediaWorkerLoop.ts` |
| Composition root | `apps/media-worker/src/main.ts` + `apps/media-worker/src/container.ts` (there is **no** `bootstrap.ts`; `src/index.ts` is empty) |
| Worker IoC policy | `apps/media-worker/src/ioc.config.ts` |
| Worker manifest (untracked, generated) | `apps/media-worker/src/generated/ioc-manifest.ts`, `ioc-composed.ts` |
| `logMediaWorkerStartup` | `apps/media-worker/src/tasks/queue/mediaWorkers/logMediaWorkerStartup.ts` |
| `runNextMediaDeletionJob` + `processNextMediaDeletionJob` | both in `apps/media-worker/src/tasks/queue/mediaWorkers/processNextMediaDeletionJob.ts` |
| worker-core UoW | `packages/context/worker-core/src/infrastructure/repositories/unitOfWork.ts` |
| worker-core IoC policy | `packages/context/worker-core/src/ioc.config.ts` |
| Queue claim mechanics | `packages/context/worker-core/src/repositories/createJobQueueRepository.ts` (the root `CLAUDE.md` calls this `queueClaimable.ts`; that filename does not exist — the `QueueClaimable` *type* is exported from this file) |
