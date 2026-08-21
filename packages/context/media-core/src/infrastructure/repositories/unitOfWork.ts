import { Logger } from '@packages/infrastructure';
import { Knex } from 'knex';
import { DomainEvent } from '../../domain/domainEvents/DomainEvent';
import { EventPublisher } from '../../domain/domainEvents/eventPublisher';
import { RequestScopeLifeCycle } from '../../services';

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
  flagRollback: () => void;
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
  return {
    id,
    start: async () => {
      if (!trx) {
        trx = await database.transaction();
      }
    },
    db: () => {
      if (!trx) throw new Error('Transaction not started');
      return trx;
    },
    complete: async (ok: boolean) => {
      if (!trx) throw new Error('Transaction not started');
      if (ok && !shouldRollback) {
        await trx.commit();
        await eventPublisher.publish(events);
      } else {
        await trx.rollback();
      }
      events = [];
    },
    collectEvents: (newEvents: DomainEvent[]) => {
      logger.info(`[UnitOfWork] events collected: ${newEvents.map((x) => x.kind).join(', ')}`);
      events.push(...newEvents);
    },
    flagRollback: () => (shouldRollback = true),
  };
};
