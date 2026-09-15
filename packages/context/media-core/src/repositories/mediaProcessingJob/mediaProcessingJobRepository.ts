import { MediaJobStatus } from '@packages/contracts';

import type { EntityId } from '@packages/contracts';
import { RequestScopeLifeCycle } from '@packages/infrastructure';
import { UnitOfWork } from '../../infrastructure';

/**
 * Attempt budget for one media processing job, shared by the two places that
 * enforce it: the worker's thrown-error retry path (give up once attempts are
 * exhausted) and the stalled-job sweep (a stall never throws, so without this
 * cap the sweep would resurrect a worker-killing job forever).
 */
export const MAX_MEDIA_PROCESSING_JOB_ATTEMPTS = 3;

export type MediaProcessingJobRow = {
  id: EntityId;
  mediaItemId: EntityId;
  status: MediaJobStatus;
  attemptCount: number;
  availableAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: EntityId;
  updatedBy: EntityId;
  startedAt?: Date;
  completedAt?: Date;
  lastError?: string;
};

export interface MediaProcessingJobRepository extends RequestScopeLifeCycle {
  enqueueIfNoneActive: (input: { mediaItemId: EntityId; actorId: EntityId }) => Promise<void>;
}

export type ReleaseStalledJobsResult = {
  /** Stalled jobs under the attempt cap, put back to PENDING for another claim. */
  released: number;
  /** Stalled jobs at/over the cap, marked FAILED (their items moved off PROCESSING too). */
  failed: number;
};

type MediaProcessingJobRepositoryDeps = {
  uow: UnitOfWork;
};

export const build__MediaProcessingJobRepository = ({
  uow,
}: MediaProcessingJobRepositoryDeps): MediaProcessingJobRepository => {
  // The enqueue must ride the caller's request transaction so the job row and the
  // item's status change commit (or roll back) together — a job visible before the
  // item's PROCESSING status commits gets claimed against a still-PENDING item and
  // rejected terminally.
  const enqueueIfNoneActive = async (input: {
    mediaItemId: EntityId;
    actorId: EntityId;
  }): Promise<void> => {
    await uow
      .db()('mediaProcessingJob')
      .insert({
        id: crypto.randomUUID(),
        mediaItemId: input.mediaItemId,
        status: MediaJobStatus.pending.value,
        attemptCount: 0,
        availableAt: uow.db().fn.now(),
        createdBy: input.actorId,
        updatedBy: input.actorId,
      })
      .onConflict()
      .ignore();
  };

  return {
    enqueueIfNoneActive,
  };
};
