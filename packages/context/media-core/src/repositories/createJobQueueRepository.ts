import { MediaJobStatus } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';

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
export type RetryOutcome = 'retrying' | 'exhausted' | 'notOwned' | 'failed';
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

const RETRY_BASE_SECONDS = 30;
const RETRY_CAP_SECONDS = 3600;
const MAX_ATTEMPTS = 3;

export const createJobQueueRepository = <TRow extends ClaimableRow>(
  database: Knex,
  { table, attemptCountColumn }: QueueClaimableConfig,
): QueueClaimable<TRow> => {
  const claimNextAvailableJob = async (): Promise<TRow | undefined> => {
    const rows = await database.transaction(async (trx: Knex.Transaction) => {
      // No `.select()` — defaults to `select *`, matching the original SQL. The
      // builder type args are intentionally untyped here (knex's conditional
      // table types don't resolve over a generic TRow); the runtime chain is
      // unchanged and the row shape is reasserted via the cast below.
      const selected = await trx(table)
        .where({ status: MediaJobStatus.pending.value })
        .andWhere('availableAt', '<=', trx.fn.now())
        .orderBy('availableAt', 'asc')
        .orderBy('id', 'asc')
        .forUpdate()
        .skipLocked()
        .limit(1);

      const next = selected[0] as Pick<TRow, 'id'> | undefined;
      if (!next) {
        return [] as TRow[];
      }

      const updated = await withEnumRevival(
        trx(table)
          .where({ id: next.id, status: MediaJobStatus.pending.value })
          .update({
            status: MediaJobStatus.processing.value,
            startedAt: trx.fn.now(),
            attemptCount: trx.raw('?? + 1', [attemptCountColumn]),
            updatedAt: trx.fn.now(),
          })
          .returning('*'),
        { status: MediaJobStatus },
      );

      return updated as TRow[];
    });

    return rows[0];
  };

  const markSucceeded = async (
    jobId: EntityId,
    actorId: EntityId,
    uow?: UnitOfWork,
  ): Promise<boolean> => {
    const count = await (uow?.db() || database)('mediaProcessingJob')
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .update({
        status: MediaJobStatus.succeeded.value,
        completedAt: database.fn.now(),
        lastError: undefined,
        updatedAt: database.fn.now(),
        updatedBy: actorId,
      });
    return count === 1;
  };

  const markFailed = async (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
    uow: UnitOfWork,
  ): Promise<boolean> => {
    const count = await uow
      .db()(table)
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .update({
        status: MediaJobStatus.failed.value,
        completedAt: database.fn.now(),
        lastError: truncateError(lastError, 8000),
        updatedAt: database.fn.now(),
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
    uow: UnitOfWork,
  ): Promise<RetryOutcome> => {
    const row = await uow
      .db()(table)
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .first();

    if (!row) {
      return 'notOwned';
    }

    if (row[attemptCountColumn] >= MAX_ATTEMPTS) {
      await markFailed(jobId, actorId, `attempts exhausted (${MAX_ATTEMPTS}): ${reason}`, uow);
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
        availableAt: database.raw("now() + (? || ' seconds')::interval", [backoff]),
        lastError: reason,
        updatedAt: database.fn.now(),
        updatedBy: actorId,
      });
    return count === 1 ? 'retrying' : 'failed';
  };

  return {
    claimNextAvailableJob,
    markSucceeded,
    markFailed,
    markPendingRetry,
  };
};
