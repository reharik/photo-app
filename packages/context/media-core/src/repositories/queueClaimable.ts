import { MediaItemStatus } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';

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
  status: MediaItemStatus;
  attemptCount: number;
  availableAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastError?: string;
};

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
  markSucceeded: (jobId: EntityId, actorId: EntityId) => Promise<void>;
  markFailed: (jobId: EntityId, actorId: EntityId, lastError: string) => Promise<void>;
  markPendingRetry: (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
    availableAt: Date,
  ) => Promise<void>;
};

export const createQueueClaimable = <TRow extends ClaimableRow>(
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
        .where({ status: MediaItemStatus.pending.value })
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
          .where({ id: next.id, status: MediaItemStatus.pending.value })
          .update({
            status: MediaItemStatus.processing.value,
            startedAt: trx.fn.now(),
            attemptCount: trx.raw('?? + 1', [attemptCountColumn]),
            updatedAt: trx.fn.now(),
          })
          .returning('*'),
        { status: MediaItemStatus },
        { strict: true },
      );

      return updated as TRow[];
    });

    return rows[0];
  };

  const markSucceeded = async (jobId: EntityId, actorId: EntityId): Promise<void> => {
    await database(table).where({ id: jobId }).update({
      status: MediaItemStatus.succeeded.value,
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
    await database(table)
      .where({ id: jobId })
      .update({
        status: MediaItemStatus.failed.value,
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
    await database(table)
      .where({ id: jobId })
      .update({
        status: MediaItemStatus.pending.value,
        lastError: truncateError(lastError, 8000),
        availableAt,
        startedAt: null,
        updatedAt: database.fn.now(),
        updatedBy: actorId,
      });
  };

  return {
    claimNextAvailableJob,
    markSucceeded,
    markFailed,
    markPendingRetry,
  };
};
