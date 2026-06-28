import { MediaItemStatus } from '@packages/contracts';
import type { Knex } from 'knex';
import { DatabaseError } from 'pg';

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
  enqueueIfNoneActive: (input: { mediaItemId: EntityId; actorId: EntityId }) => Promise<void>;
  claimNextAvailableJob: () => Promise<MediaProcessingJobRow | undefined>;
  markSucceeded: (jobId: EntityId, actorId: EntityId) => Promise<void>;
  markFailed: (jobId: EntityId, actorId: EntityId, lastError: string) => Promise<void>;
};

const isUniqueViolation = (e: unknown): boolean => {
  return e instanceof DatabaseError && e.code === '23505';
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

  const enqueueIfNoneActive = async (input: {
    mediaItemId: EntityId;
    actorId: EntityId;
  }): Promise<void> => {
    try {
      await database('mediaProcessingJob').insert({
        id: crypto.randomUUID(),
        mediaItemId: input.mediaItemId,
        status: MediaItemStatus.pending.value,
        attemptCount: 0,
        availableAt: database.fn.now(),
        createdBy: input.actorId,
        updatedBy: input.actorId,
      });
    } catch (e) {
      if (isUniqueViolation(e)) {
        return;
      }
      throw e;
    }
  };

  return {
    enqueueIfNoneActive,
    claimNextAvailableJob: queue.claimNextAvailableJob,
    markSucceeded: queue.markSucceeded,
    markFailed: queue.markFailed,
  };
};
