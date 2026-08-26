import { MediaJobStatus } from '@packages/contracts';
import type { Knex } from 'knex';

import { UnitOfWork } from '../../infrastructure';
import type { EntityId } from '../../types/types';
import { createJobQueueRepository, RetryOutcome } from '../createJobQueueRepository';

export type MediaDeletionJobRow = {
  id: EntityId;
  mediaItemId: EntityId;
  /** Base prefix for object keys in storage (snapshot when the job was enqueued). */
  storageKey: string;
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

export type MediaDeletionJobRepository = {
  claimNextAvailableJob: () => Promise<MediaDeletionJobRow | undefined>;
  markSucceeded: (jobId: EntityId, actorId: EntityId, uow?: UnitOfWork) => Promise<boolean>;
  markFailed: (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
    uow: UnitOfWork,
  ) => Promise<boolean>;
  markPendingRetry: (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
    uow: UnitOfWork,
  ) => Promise<RetryOutcome>;
};

type MediaDeletionJobRepositoryDeps = {
  database: Knex;
};

export const build__MediaDeletionJobRepository = ({
  database,
}: MediaDeletionJobRepositoryDeps): MediaDeletionJobRepository => {
  const jobRepo = createJobQueueRepository<MediaDeletionJobRow>(database, {
    table: 'mediaDeletionJob',
    attemptCountColumn: 'attempt_count',
  });

  return {
    claimNextAvailableJob: jobRepo.claimNextAvailableJob,
    markSucceeded: jobRepo.markSucceeded,
    markFailed: jobRepo.markFailed,
    markPendingRetry: jobRepo.markPendingRetry,
  };
};
