import { Logger } from '@packages/infrastructure';
import { Knex } from 'knex';
import { DomainEvent } from '../../domain/domainEvents/DomainEvent';
import { EventPublisher } from '../../domain/domainEvents/eventPublisher';

export type UnitOfWork = {
  id: string;
  /**
   * Set by the GraphQL write boundary when a mutation field returns a failed
   * WriteResult (fail-as-data). The failure never reaches the GraphQL `errors`
   * channel, so the boundary flags the intent to roll back here and reads it back
   * at commit time. Any single failed field flips this true for the whole
   * request — the uow is per-request, so partial commit is impossible anyway.
   */
  shouldRollback: boolean;
  start: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  db: () => Knex.Transaction;
  collectEvents: (events: DomainEvent[]) => void;
};

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
  return {
    id,
    shouldRollback: false,
    start: async () => {
      trx = await database.transaction();
    },
    db: () => {
      if (!trx) throw new Error('Transaction not started');
      return trx;
    },
    commit: async () => {
      if (!trx) throw new Error('Transaction not started');
      await trx?.commit();
      await eventPublisher.publish(events);
      events = [];
    },
    rollback: async () => {
      if (!trx) throw new Error('Transaction not started');
      await trx?.rollback();
    },
    collectEvents: (newEvents: DomainEvent[]) => {
      logger.info(`[UnitOfWork] events collected: ${newEvents.map((x) => x.kind).join(', ')}`);
      events.push(...newEvents);
    },
  };
};
