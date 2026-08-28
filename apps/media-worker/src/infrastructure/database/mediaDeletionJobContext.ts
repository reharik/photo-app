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
