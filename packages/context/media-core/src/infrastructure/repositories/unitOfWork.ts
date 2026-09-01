import { Logger } from '@packages/infrastructure';
import { Knex } from 'knex';
import { DomainEvent } from '../../domainEvents/domainEvent';
import { EventPublisher } from '../../domainEvents/eventPublisher';
import { RequestScopeLifeCycle } from '../../services';

export interface UnitOfWork extends RequestScopeLifeCycle {
  id: string;
  beginIsolatedOnly: () => Promise<void>;
  join: () => Promise<void>;
  db: () => Knex.Transaction;
  complete: (ok: boolean) => Promise<void>;
  settle: (ok: boolean) => Promise<void>;
  collectEvents: (events: DomainEvent[]) => void;
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
  eventPublisher: EventPublisher;
  logger: Logger;
};

export const build__UnitOfWork = ({
  database,
  eventPublisher,
  logger,
}: UnitOfWorkDeps): UnitOfWork => {
  const id = crypto.randomUUID();
  let trx: Knex.Transaction | undefined;
  let events: DomainEvent[] = [];
  let shouldRollback = false;

  const reset = () => {
    trx = undefined;
    events = [];
    shouldRollback = false;
  };

  /**
   * Commit-THEN-publish. The handlers write through THIS uow, so the committed
   * transaction has to be cleared before they run: leave it in place and their first
   * `join()` reuses a dead handle, every write throws "Transaction query already
   * complete", and eventPublisher swallows it — a silently dead post-commit bus.
   *
   * Clearing it means their first repository call opens a FRESH transaction, which
   * belongs to nobody but us: the request boundary already settled as far as it is
   * concerned, so we commit it here. Events recorded by a handler are not re-published
   * — the bus is deliberately one hop deep and best-effort (no outbox, no retry).
   */
  const publishPostCommit = async () => {
    const published = events;
    reset();
    if (!published.length) {
      return;
    }
    try {
      await eventPublisher.publish(published);
      if (trx) {
        await trx.commit();
        logger.debug(`[uow:${id}] post-commit handler transaction committed`);
      }
    } catch (e) {
      if (trx) {
        await trx.rollback();
      }
      logger.error(`[uow:${id}] post-commit handler transaction failed`, e);
    } finally {
      reset();
    }
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
    await publishPostCommit();
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
    collectEvents: (newEvents: DomainEvent[]) => {
      if (newEvents.length) {
        logger.debug(`[uow:${id}] events collected: ${newEvents.map((x) => x.kind).join(', ')}`);
      }
      events.push(...newEvents);
    },
    flagRollbackOnly: () => {
      logger.warn(`[uow:${id}] flagRollbackOnly called`);
      shouldRollback = true;
    },
  };
};
