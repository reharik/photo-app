import { Logger, RequestScopeLifeCycle } from '@packages/infrastructure';
import { Knex } from 'knex';
import { DomainEvent } from '../../domainEvents/domainEvent';
import { EventPublisher } from '../../domainEvents/eventPublisher';

export interface UnitOfWork extends RequestScopeLifeCycle {
  id: string;
  start: () => Promise<void>;
  db: () => Knex.Transaction;
  complete: (ok: boolean) => Promise<void>;
  collectEvents: (events: DomainEvent[]) => void;
  /**
   * Set by the GraphQL write boundary when a mutation field returns a failed
   * OperationResult (fail-as-data). The failure never reaches the GraphQL `errors`
   * channel, so the boundary flags the intent to roll back here and complete reads it back
   * at commit time. Any single failed field flips this true for the whole
   * request — the uow is per-request, so partial commit is impossible anyway.
   */
  flagRollbackOnly: () => void;
  /**
   * Runs `fn` inside a transaction, committing if it returns and rolling back if it throws.
   *
   * This is the verb to reach for. `start` and `complete` are the primitives underneath it,
   * and are only needed at boundaries that can't be expressed as a function — the GraphQL
   * envelop plugin, for instance, where `onExecute` and `onExecuteDone` are separate hooks
   * with the request execution in between.
   *
   * A throw from `fn` rolls back and propagates unchanged; the rollback never replaces the
   * original error. `flagRollbackOnly()` is honoured, so a fail-as-data path that flags
   * mid-flight still rolls back even though `fn` returned normally.
   *
   * Nesting throws — `start` refuses to open a transaction while one is already open. If you
   * need a second boundary inside a job, close the first one before opening the next. That's
   * the shape a job with external I/O in the middle wants anyway: commit, do the S3 or SES
   * work outside any transaction, then open a fresh one to record the result.
   *
   * @example
   * const rows = await uow.inTransaction(() => claimPendingRows(50));
   *
   * @example Failure is survivable — pair with `bestEffort`:
   * await bestEffort(
   *   () => uow.inTransaction(() => recordDelivery(messageId)),
   *   (e) => logger.error('[sweep] delivery record failed — telemetry gap', e),
   * );
   */
  inTransaction: <T>(fn: () => Promise<T>) => Promise<T>;
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
    trx = await database.transaction(); // explicit second boundary
    try {
      await eventPublisher.publish(published);
      await trx.commit();
      logger.debug(`[uow:${id}] post-commit handler transaction committed`);
    } catch (e) {
      await trx.rollback();
      logger.error(`[uow:${id}] post-commit handler transaction failed`, e);
    } finally {
      reset();
    }
  };
  const completeTransaction = async (ok: boolean) => {
    if (!trx) return;
    const t = trx;
    try {
      if (!ok || shouldRollback) {
        await t.rollback();
        logger.debug(`[uow:${id}] rolled back (${shouldRollback ? 'flagged' : 'failed'})`);
        return;
      }
      await t.commit();
      logger.debug(`[uow:${id}] committed`);

      await publishPostCommit();
    } finally {
      reset();
    }
  };
  const start = async () => {
    if (trx) {
      throw new Error(`[uow:${id}] Transaction already open when start called`);
    }

    logger.debug(`[uow:${id}] New transaction created`);
    trx = await database.transaction();
  };
  return {
    id,
    start,
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
    inTransaction: async <T>(fn: () => Promise<T>): Promise<T> => {
      await start();
      try {
        const result = await fn();
        await completeTransaction(true);
        return result;
      } catch (e) {
        await completeTransaction(false);
        throw e;
      }
    },
  };
};
