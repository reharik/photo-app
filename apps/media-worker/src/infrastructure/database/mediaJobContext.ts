import { UnitOfWork } from '@packages/media-core';
import { ScopeRoot } from 'ioc-manifest';

import { ProcessNextMediaImageJob } from '../../tasks/queue/mediaWorkers/processNextMediaImageJob.js';

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
  processNextMediaImageJob: ProcessNextMediaImageJob;
  start: () => Promise<void>;
  finalize: (ok: boolean) => Promise<void>;
}

type MediaJobContextDeps = {
  processNextMediaImageJob: ProcessNextMediaImageJob;
  uow: UnitOfWork;
};

export const build__MediaJobContext = ({
  processNextMediaImageJob,
  uow,
}: MediaJobContextDeps): ScopeRoot<MediaJobContext> => ({
  processNextMediaImageJob,
  start: uow.start,
  finalize: uow.complete,
});
