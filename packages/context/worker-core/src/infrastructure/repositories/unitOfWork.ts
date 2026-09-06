import { Logger } from '@packages/infrastructure';
import { Knex } from 'knex';
import { RequestScopeLifeCycle } from '../../services';

export interface UnitOfWork extends RequestScopeLifeCycle {
  id: string;
  beginIsolatedOnly: () => Promise<void>;
  join: () => Promise<void>;
  db: () => Knex.Transaction;
  complete: (ok: boolean) => Promise<void>;
  settle: (ok: boolean) => Promise<void>;
  /**
   * Set by the GraphQL write boundary when a mutation field returns a failed
   * OperationResult (fail-as-data). The failure never reaches the GraphQL `errors`
   * channel, so the boundary flags the intent to roll back here and complete reads it back
   * at commit time. Any single failed field flips this true for the whole
   * request — the uow is per-request, so partial commit is impossible anyway.
   */
  flagRollbackOnly: () => void;
}

type UnitOfWorkDeps = {
  database: Knex;
  logger: Logger;
};

export const build__UnitOfWork = ({ database, logger }: UnitOfWorkDeps): UnitOfWork => {
  const id = crypto.randomUUID();
  let trx: Knex.Transaction | undefined;
  let shouldRollback = false;

  const reset = () => {
    trx = undefined;
    shouldRollback = false;
  };

  const completeTransaction = async (ok: boolean) => {
    if (!trx) {
      return;
    }
    if (!ok || shouldRollback) {
      await trx.rollback();
      logger.debug(`[uow:${id}] rolled back (${shouldRollback ? 'flagged' : 'failed'})`);
      reset();
      return;
    }
    await trx.commit();
    logger.debug(`[uow:${id}] committed`);
  };
  let openedAt: string | undefined;
  return {
    id,
    beginIsolatedOnly: async () => {
      if (trx) {
        throw new Error(`[uow:${id}] Transaction already active when beginIsolatedOnly called`);
      }
      trx = await database.transaction();
      logger.debug(`[uow:${id}] Transaction begun in isolation`);
    },
    join: async () => {
      if (!trx) {
        openedAt = new Error().stack;
        logger.debug(`[uow:${id}] New transaction created`);
        trx = await database.transaction();
      }
    },
    db: () => {
      if (!trx) throw new Error(`[uow:${id}] Transaction not started`);
      return trx;
    },
    complete: async (ok: boolean) => {
      if (!trx) {
        logger.info(`[uow:${id}] No transaction available when Complete called`);
        throw new Error('Transaction not started');
      }
      await completeTransaction(ok);
    },
    settle: async (ok: boolean) => {
      if (!trx) {
        reset();
        return;
      }
      logger.warn(`[uow:${id}] settle resolving an open transaction`, { openedAt });

      try {
        await completeTransaction(ok);
      } catch (e) {
        logger.error(`[uow:${id}] settle failed to resolve the transaction`, e);
        reset();
      }
    },
    flagRollbackOnly: () => {
      logger.warn(`[uow:${id}] flagRollbackOnly called`);
      shouldRollback = true;
    },
  };
};
