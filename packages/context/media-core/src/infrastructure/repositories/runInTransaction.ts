import { Knex } from 'knex';
import { WriteResult } from 'src/types/types';

export interface RunInTransaction {
  <T>(trx: Knex.Transaction | undefined, fn: (db: Knex.Transaction) => Promise<T>): Promise<T>;
}

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
// touch
