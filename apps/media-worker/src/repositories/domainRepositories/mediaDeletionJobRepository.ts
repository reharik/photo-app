import type {
  MediaDeletionJobRepository as DomainMediaDeletionJobRepository,
  EntityId,
  MediaDeletionJobRow,
} from '@packages/media-core';
import { MediaDeletionJobStatus } from '@packages/media-core';
import type { Knex } from 'knex';
import { DatabaseError } from 'pg';
import { IocGeneratedCradle } from '../../di/generated/ioc-registry.types';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MediaDeletionJobRepository extends DomainMediaDeletionJobRepository {}

const isUniqueViolation = (e: unknown): boolean => {
  return e instanceof DatabaseError && e.code === '23505';
};

const truncateError = (message: string, maxLen: number): string => {
  if (message.length <= maxLen) {
    return message;
  }
  return `${message.slice(0, maxLen - 3)}...`;
};

export const build__MediaDeletionJobRepository = ({
  database,
}: IocGeneratedCradle): MediaDeletionJobRepository => {
  const enqueueIfNoneActive = async (input: {
    mediaItemId: EntityId;
    storageKey: string;
    actorId: EntityId;
  }): Promise<void> => {
    try {
      await database('mediaDeletionJob').insert({
        id: crypto.randomUUID(),
        mediaItemId: input.mediaItemId,
        storageKey: input.storageKey,
        status: MediaDeletionJobStatus.pending,
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

  const claimNextAvailableJob = async (): Promise<MediaDeletionJobRow | undefined> => {
    const rows = await database.transaction(async (trx: Knex.Transaction) => {
      const selected = await trx<Pick<MediaDeletionJobRow, 'id'>>('mediaDeletionJob')
        .where({ status: MediaDeletionJobStatus.pending })
        .andWhere('availableAt', '<=', trx.fn.now())
        .orderBy('availableAt', 'asc')
        .orderBy('id', 'asc')
        .forUpdate()
        .skipLocked()
        .limit(1);

      const next = selected[0];
      if (!next) {
        return [] as MediaDeletionJobRow[];
      }

      const updated = await trx<MediaDeletionJobRow>('mediaDeletionJob')
        .where({ id: next.id, status: MediaDeletionJobStatus.pending })
        .update({
          status: MediaDeletionJobStatus.processing,
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
    await database('mediaDeletionJob').where({ id: jobId }).update({
      status: MediaDeletionJobStatus.succeeded,
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
    await database('mediaDeletionJob')
      .where({ id: jobId })
      .update({
        status: MediaDeletionJobStatus.failed,
        completedAt: database.fn.now(),
        lastError: truncateError(lastError, 8000),
        updatedAt: database.fn.now(),
        updatedBy: actorId,
      });
  };

  const markPendingRetry = async (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
    availableAt: Date,
  ): Promise<void> => {
    await database('mediaDeletionJob')
      .where({ id: jobId })
      .update({
        status: MediaDeletionJobStatus.pending,
        lastError: truncateError(lastError, 8000),
        availableAt,
        startedAt: null,
        updatedAt: database.fn.now(),
        updatedBy: actorId,
      });
  };

  return {
    enqueueIfNoneActive,
    claimNextAvailableJob,
    markSucceeded,
    markFailed,
    markPendingRetry,
  };
};
