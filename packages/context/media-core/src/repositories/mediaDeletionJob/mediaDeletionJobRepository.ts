import { MediaJobStatus } from '@packages/contracts';

import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
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

export interface MediaDeletionJobRepository extends RequestScopeLifeCycle {
  claimNextAvailableJob: () => Promise<MediaDeletionJobRow | undefined>;
  markSucceeded: (jobId: EntityId, actorId: EntityId) => Promise<boolean>;
  markFailed: (jobId: EntityId, actorId: EntityId, lastError: string) => Promise<boolean>;
  markPendingRetry: (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
  ) => Promise<RetryOutcome>;
}

type MediaDeletionJobRepositoryDeps = {
  uow: UnitOfWork;
};

export const build__MediaDeletionJobRepository = ({
  uow,
}: MediaDeletionJobRepositoryDeps): MediaDeletionJobRepository => {
  const jobRepo = createJobQueueRepository<MediaDeletionJobRow>(uow, {
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
