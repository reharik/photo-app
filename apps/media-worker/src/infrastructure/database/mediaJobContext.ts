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
  start: uow.start,
  finalize: uow.complete,
});
