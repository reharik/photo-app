import { MediaItemStatus } from '@packages/contracts';
import type { Knex } from 'knex';

import { UnitOfWork } from '../../infrastructure';
import type { EntityId } from '../../types/types';
import { createQueueClaimable } from '../queueClaimable';

/**
 * Attempt budget for one media processing job, shared by the two places that
 * enforce it: the worker's thrown-error retry path (give up once attempts are
 * exhausted) and the stalled-job sweep (a stall never throws, so without this
 * cap the sweep would resurrect a worker-killing job forever).
 */
export const MAX_MEDIA_PROCESSING_JOB_ATTEMPTS = 5;

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
  releaseStalledJobs: (stalledBefore: Date) => Promise<ReleaseStalledJobsResult>;
};

export type ReleaseStalledJobsResult = {
  /** Stalled jobs under the attempt cap, put back to PENDING for another claim. */
  released: number;
  /** Stalled jobs at/over the cap, marked FAILED (their items moved off PROCESSING too). */
  failed: number;
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

  /**
   * Reclaim jobs stranded in PROCESSING by a worker that died mid-job. Same stall
   * predicate, two outcomes split on the attempt cap:
   * - under the cap: back to PENDING, claimable now — "a worker died".
   * - at/over the cap: FAILED — "an item is killing workers". The claim itself
   *   increments attemptCount, and a stall never reaches the worker's catch-path
   *   cap check, so without this arm the sweep would resurrect a poison job forever.
   *
   * The fail arm mirrors the worker's terminal-failure path
   * (markProcessingFailed: PROCESSING → FAILED, no-op otherwise): a FAILED job
   * whose item stays PROCESSING would just trade a stranded job for a stranded
   * item — the same silent hang in a different table. Both updates stamp
   * updatedBy from the row's own createdBy (the actor that enqueued the work).
   */
  const releaseStalledJobs = async (stalledBefore: Date): Promise<ReleaseStalledJobsResult> => {
    const released = await database('mediaProcessingJob')
      .where({ status: MediaItemStatus.processing.value })
      .where('startedAt', '<', stalledBefore)
      .where('attemptCount', '<', MAX_MEDIA_PROCESSING_JOB_ATTEMPTS)
      .update({
        status: MediaItemStatus.pending.value,
        lastError: 'Reclaimed: stalled in PROCESSING',
        availableAt: database.fn.now(),
        startedAt: null,
        updatedAt: database.fn.now(),
        updatedBy: database.ref('createdBy'),
      });

    const failedRows = await database('mediaProcessingJob')
      .where({ status: MediaItemStatus.processing.value })
      .where('startedAt', '<', stalledBefore)
      .where('attemptCount', '>=', MAX_MEDIA_PROCESSING_JOB_ATTEMPTS)
      .update({
        status: MediaItemStatus.failed.value,
        lastError: 'Reclaimed: exceeded max attempts while stalled',
        completedAt: database.fn.now(),
        updatedAt: database.fn.now(),
        updatedBy: database.ref('createdBy'),
      })
      .returning<{ mediaItemId: EntityId }[]>('mediaItemId');

    if (failedRows.length > 0) {
      await database('mediaItem')
        .whereIn(
          'id',
          failedRows.map((row) => row.mediaItemId),
        )
        .where({ status: MediaItemStatus.processing.value })
        .update({
          status: MediaItemStatus.failed.value,
          updatedAt: database.fn.now(),
          updatedBy: database.ref('createdBy'),
        });
    }

    return { released, failed: failedRows.length };
  };

  return {
    enqueueIfNoneActive,
    claimNextAvailableJob: queue.claimNextAvailableJob,
    markSucceeded: queue.markSucceeded,
    markFailed: queue.markFailed,
    markPendingRetry: queue.markPendingRetry,
    releaseStalledJobs,
  };
};
