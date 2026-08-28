import { MediaJobStatus } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';

import { UnitOfWork } from '../infrastructure';
import type { EntityId } from '../types/types';

/**
 * Shared claim/mark mechanics for FOR-UPDATE-SKIP-LOCKED queue tables
 * (media_processing_job, media_deletion_job). Plain factory — intentionally
 * NOT a `build__*` export, so it is never registered as an IoC contract; it is
 * composed inside the two existing repository factories instead.
 */

/** Minimal shape every claimable queue row must satisfy. */
export type ClaimableRow = {
  id: EntityId;
  status: MediaJobStatus;
  attemptCount: number;
  availableAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastError?: string;
};
export type RetryOutcome = 'retrying' | 'exhausted' | 'notOwned';
type QueueClaimableConfig = {
  /** Knex table identifier (camelCase; the knex case-mapping layer maps it to snake_case). */
  table: string;
  /** DB column name for the raw `?? + 1` increment, e.g. 'attempt_count'. Must be the
   *  physical column name — the raw increment bypasses the case-mapping layer. */
  attemptCountColumn: string;
};

const truncateError = (message: string, maxLen: number): string => {
  if (message.length <= maxLen) {
    return message;
  }
  return `${message.slice(0, maxLen - 3)}...`;
};

export type QueueClaimable<TRow extends ClaimableRow> = {
  claimNextAvailableJob: () => Promise<TRow | undefined>;
  markSucceeded: (jobId: EntityId, actorId: EntityId) => Promise<boolean>;
  markFailed: (jobId: EntityId, actorId: EntityId, lastError: string) => Promise<boolean>;
  markPendingRetry: (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
  ) => Promise<RetryOutcome>;
};

const RETRY_BASE_SECONDS = 30;
const RETRY_CAP_SECONDS = 3600;
const MAX_ATTEMPTS = 3;

export const createJobQueueRepository = <TRow extends ClaimableRow>(
  uow: UnitOfWork,
  { table, attemptCountColumn }: QueueClaimableConfig,
): QueueClaimable<TRow> => {
  const claimNextAvailableJob = async (): Promise<TRow | undefined> => {
    // The claim owns its own boundary: FOR UPDATE SKIP LOCKED must commit
    // independently so the PROCESSING flip is visible to other workers before
    // the caller does any downstream work. begin() throws if a boundary is
    // already open — that's deliberate, this must never be a savepoint.
    await uow.beginIsolatedOnly();
    try {
      const selected = await uow
        .db()(table)
        .where({ status: MediaJobStatus.pending.value })
        .andWhere('availableAt', '<=', uow.db().fn.now())
        .orderBy('availableAt', 'asc')
        .orderBy('id', 'asc')
        .forUpdate()
        .skipLocked()
        .limit(1)
        .select<Pick<ClaimableRow, 'id'>[]>('id');

      const next = selected[0];
      if (!next) {
        await uow.complete(true);
        return undefined;
      }

      const updated = await withEnumRevival(
        uow
          .db()(table)
          .where({ id: next.id, status: MediaJobStatus.pending.value })
          .update({
            status: MediaJobStatus.processing.value,
            startedAt: uow.db().fn.now(),
            attemptCount: uow.db().raw('?? + 1', [attemptCountColumn]),
            updatedAt: uow.db().fn.now(),
          })
          .returning('*'),
        { status: MediaJobStatus },
      );

      await uow.complete(true);
      return updated[0] as TRow;
    } catch (e) {
      await uow.complete(false);
      throw e;
    }
  };

  const markSucceeded = async (jobId: EntityId, actorId: EntityId): Promise<boolean> => {
    await uow.join();
    const count = await uow
      .db()(table)
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .update({
        status: MediaJobStatus.succeeded.value,
        completedAt: uow.db().fn.now(),
        lastError: null,
        updatedAt: uow.db().fn.now(),
        updatedBy: actorId,
      });
    return count === 1;
  };

  const markFailed = async (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
  ): Promise<boolean> => {
    await uow.join();
    const count = await uow
      .db()(table)
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .update({
        status: MediaJobStatus.failed.value,
        completedAt: uow.db().fn.now(),
        lastError: truncateError(lastError, 8000),
        updatedAt: uow.db().fn.now(),
        updatedBy: actorId,
      });
    return count === 1;
  };

  /**
   * Retry policy lives here, not at call sites: attempt cap and backoff are
   * properties of the queue. Exceeding the cap terminal-fails instead.
   * attemptCount was already incremented at claim time.
   */
  const markPendingRetry = async (
    jobId: EntityId,
    actorId: EntityId,
    reason: string,
  ): Promise<RetryOutcome> => {
    await uow.join();
    // first here is ok vs exists because a) it is awaited and b) the value
    // is needed for the max attempts call
    const row = await uow
      .db()(table)
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .first<Record<string, number>>(attemptCountColumn);

    if (!row) {
      return 'notOwned';
    }

    if (row[attemptCountColumn] >= MAX_ATTEMPTS) {
      await markFailed(jobId, actorId, `attempts exhausted (${MAX_ATTEMPTS}): ${reason}`);
      return 'exhausted';
    }

    const backoff = Math.min(
      RETRY_BASE_SECONDS * 2 ** Math.max(0, row[attemptCountColumn] - 1),
      RETRY_CAP_SECONDS,
    );

    const count = await uow
      .db()(table)
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .update({
        status: MediaJobStatus.pending.value,
        availableAt: uow.db().raw("now() + (? || ' seconds')::interval", [backoff]),
        lastError: reason,
        updatedAt: uow.db().fn.now(),
        updatedBy: actorId,
      });
    return count === 1 ? 'retrying' : 'notOwned';
  };

  return {
    claimNextAvailableJob,
    markSucceeded,
    markFailed,
    markPendingRetry,
  };
};
