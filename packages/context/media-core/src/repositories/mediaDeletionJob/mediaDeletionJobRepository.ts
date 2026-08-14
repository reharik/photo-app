import { MediaItemStatus } from '@packages/contracts';
import type { Knex } from 'knex';

import type { EntityId } from '../../types/types';
import { createQueueClaimable } from '../queueClaimable';

export type MediaDeletionJobRow = {
  id: EntityId;
  mediaItemId: EntityId;
  /** Base prefix for object keys in storage (snapshot when the job was enqueued). */
  storageKey: string;
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

export type MediaDeletionJobRepository = {
  claimNextAvailableJob: () => Promise<MediaDeletionJobRow | undefined>;
  markSucceeded: (jobId: EntityId, actorId: EntityId) => Promise<void>;
  markFailed: (jobId: EntityId, actorId: EntityId, lastError: string) => Promise<void>;
  markPendingRetry: (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
    availableAt: Date,
  ) => Promise<void>;
};

type MediaDeletionJobRepositoryDeps = {
  database: Knex;
};

export const build__MediaDeletionJobRepository = ({
  database,
}: MediaDeletionJobRepositoryDeps): MediaDeletionJobRepository => {
  const queue = createQueueClaimable<MediaDeletionJobRow>(database, {
    table: 'mediaDeletionJob',
    attemptCountColumn: 'attempt_count',
  });

  return {
    claimNextAvailableJob: queue.claimNextAvailableJob,
    markSucceeded: queue.markSucceeded,
    markFailed: queue.markFailed,
    markPendingRetry: queue.markPendingRetry,
  };
};
