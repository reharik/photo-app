import { MediaItemStatus } from '@packages/contracts';
import type { Knex } from 'knex';

import { UnitOfWork } from '../../infrastructure';
import type { EntityId } from '../../types/types';
import { createQueueClaimable } from '../queueClaimable';

export type MediaProcessingJobRow = {
  id: EntityId;
  mediaItemId: EntityId;
  status: MediaItemStatus;
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

export type MediaProcessingJobRepository = {
  enqueueIfNoneActive: (
    input: { mediaItemId: EntityId; actorId: EntityId },
    uow: UnitOfWork,
  ) => Promise<void>;
  claimNextAvailableJob: () => Promise<MediaProcessingJobRow | undefined>;
  markSucceeded: (jobId: EntityId, actorId: EntityId) => Promise<void>;
  markFailed: (jobId: EntityId, actorId: EntityId, lastError: string) => Promise<void>;
  markPendingRetry: (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
    availableAt: Date,
  ) => Promise<void>;
};

type MediaProcessingJobRepositoryDeps = {
  database: Knex;
};

export const build__MediaProcessingJobRepository = ({
  database,
}: MediaProcessingJobRepositoryDeps): MediaProcessingJobRepository => {
  const queue = createQueueClaimable<MediaProcessingJobRow>(database, {
    table: 'mediaProcessingJob',
    attemptCountColumn: 'attempt_count',
  });

  // The enqueue must ride the caller's request transaction so the job row and the
  // item's status change commit (or roll back) together — a job visible before the
  // item's PROCESSING status commits gets claimed against a still-PENDING item and
  // rejected terminally. The uow parameter is required, not optional: an autocommit
  // fallback here is exactly the race this signature exists to prevent. The claim
  // side stays on the raw singleton handle — FOR UPDATE SKIP LOCKED needs its own
  // short transaction, never a savepoint on a request's.
  const enqueueIfNoneActive = async (
    input: { mediaItemId: EntityId; actorId: EntityId },
    uow: UnitOfWork,
  ): Promise<void> => {
    await uow
      .db()('mediaProcessingJob')
      .insert({
        id: crypto.randomUUID(),
        mediaItemId: input.mediaItemId,
        status: MediaItemStatus.pending.value,
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
    claimNextAvailableJob: queue.claimNextAvailableJob,
    markSucceeded: queue.markSucceeded,
    markFailed: queue.markFailed,
    markPendingRetry: queue.markPendingRetry,
  };
};
