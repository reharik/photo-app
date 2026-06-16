import { WriteResult } from '@packages/contracts';
import { Knex } from 'knex';

/**
 * Low-level transaction helper. Starts a new Knex transaction when `trx` is
 * undefined; otherwise runs `fn` on the supplied transaction (join an outer
 * scope).
 *
 * The callback may return any value. The transaction commits when `fn`
 * resolves without throwing and rolls back when `fn` throws. It does not
 * inspect `WriteResult` — a returned failure does not roll back by itself.
 *
 * Prefer this when validation and authorization already happened outside the
 * transaction and the block only persists already-validated state (e.g.
 * `editComment`, `toggleReaction`). Repositories inject this to save entities
 * atomically.
 */
export interface RunInTransaction {
  <T>(trx: Knex.Transaction | undefined, fn: (db: Knex.Transaction) => Promise<T>): Promise<T>;
}

/**
 * WriteResult-aware wrapper around {@link RunInTransaction}. The callback
 * must return `WriteResult<T>`. A failed result rolls the transaction back
 * but is returned to the caller instead of throwing.
 *
 * Prefer this when the transaction block orchestrates multiple write steps that
 * can fail with domain errors — especially when calling nested write services
 * that return `WriteResult` (e.g. `addComment` saving a comment and toggling a
 * reaction in one atomic unit). Pass `trx` to participate in a caller's
 * transaction; omit it to open a new one.
 */
export interface WithTransaction {
  <T>(
    trx: Knex.Transaction | undefined,
    fn: (db: Knex.Transaction) => Promise<WriteResult<T>>,
  ): Promise<WriteResult<T>>;
}

type RunInTransactionDeps = { database: Knex };
type WithTransactionDeps = { runInTransaction: RunInTransaction };

export class TransactionAbortError<T = unknown> extends Error {
  constructor(public readonly result: WriteResult<T>) {
    super('Transaction aborted due to operation failure');
    this.name = 'TransactionAbortError';
  }
}

export const unwrapOrThrow = <T>(result: WriteResult<T>): T => {
  if (!result.success) {
    throw new TransactionAbortError(result);
  }
  return result.value;
};

export const build__runInTransaction =
  ({ database }: RunInTransactionDeps): RunInTransaction =>
  async <T>(
    trx: Knex.Transaction | undefined,
    fn: (db: Knex.Transaction) => Promise<T>,
  ): Promise<T> => {
    if (trx) return fn(trx);
    return database.transaction(fn);
  };

// Converts failed WriteResults into TransactionAbortError so Knex rolls back,
// then maps that back to the failure WriteResult for the service layer.
export const build__withTransaction =
  ({ runInTransaction }: WithTransactionDeps): WithTransaction =>
  async <T>(
    trx: Knex.Transaction | undefined,
    fn: (db: Knex.Transaction) => Promise<WriteResult<T>>,
  ): Promise<WriteResult<T>> => {
    try {
      return await runInTransaction(trx, async (db) => {
        const result = await fn(db);
        if (!result.success) throw new TransactionAbortError(result);
        return result;
      });
    } catch (err) {
      if (err instanceof TransactionAbortError) return err.result as WriteResult<T>;
      throw err;
    }
  };
