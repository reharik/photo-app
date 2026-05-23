import type {
  MediaProcessingJobRepository as DomainMediaProcessingJobRepository,
  EntityId,
  MediaProcessingJobRow,
} from '@packages/media-core';
import { MediaProcessingJobStatus } from '@packages/media-core';
import type { Knex } from 'knex';
import { DatabaseError } from 'pg';
import type { AppCradle } from '../../generated/ioc-composed.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MediaProcessingJobRepository extends DomainMediaProcessingJobRepository {}

const isUniqueViolation = (e: unknown): boolean => {
  return e instanceof DatabaseError && e.code === '23505';
};

const truncateError = (message: string, maxLen: number): string => {
  if (message.length <= maxLen) {
    return message;
  }
  return `${message.slice(0, maxLen - 3)}...`;
};

export const build__MediaProcessingJobRepository = ({
  database,
}: AppCradle): MediaProcessingJobRepository => {
  const enqueueIfNoneActive = async (input: {
    mediaItemId: EntityId;
    actorId: EntityId;
  }): Promise<void> => {
    try {
      await database('mediaProcessingJob').insert({
        id: crypto.randomUUID(),
        mediaItemId: input.mediaItemId,
        status: MediaProcessingJobStatus.pending,
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

  const claimNextAvailableJob = async (): Promise<MediaProcessingJobRow | undefined> => {
    const rows = await database.transaction(async (trx: Knex.Transaction) => {
      const selected = await trx<Pick<MediaProcessingJobRow, 'id'>>('mediaProcessingJob')
        .where({ status: MediaProcessingJobStatus.pending })
        .andWhere('availableAt', '<=', trx.fn.now())
        .orderBy('availableAt', 'asc')
        .orderBy('id', 'asc')
        .forUpdate()
        .skipLocked()
        .limit(1);

      const next = selected[0];
      if (!next) {
        return [] as MediaProcessingJobRow[];
      }

      const updated = await trx<MediaProcessingJobRow>('mediaProcessingJob')
        .where({ id: next.id, status: MediaProcessingJobStatus.pending })
        .update({
          status: MediaProcessingJobStatus.processing,
          startedAt: trx.fn.now(),
          attemptCount: trx.raw('?? + 1', ['attempt_count']),
          updatedAt: trx.fn.now(),
        })
        .returning('*');

      return updated;
    });

    return rows[0];
  };

  const markSucceeded = async (jobId: EntityId, actorId: EntityId): Promise<void> => {
    await database('mediaProcessingJob').where({ id: jobId }).update({
      status: MediaProcessingJobStatus.succeeded,
      completedAt: database.fn.now(),
      lastError: undefined,
      updatedAt: database.fn.now(),
      updatedBy: actorId,
    });
  };

  const markFailed = async (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
  ): Promise<void> => {
    await database('mediaProcessingJob')
      .where({ id: jobId })
      .update({
        status: MediaProcessingJobStatus.failed,
        completedAt: database.fn.now(),
        lastError: truncateError(lastError, 8000),

        updatedAt: database.fn.now(),
        updatedBy: actorId,
      });
  };

  return {
    enqueueIfNoneActive,
    claimNextAvailableJob,
    markSucceeded,
    markFailed,
  };
};
