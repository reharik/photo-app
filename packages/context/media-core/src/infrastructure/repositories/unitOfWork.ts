import { Logger } from '@packages/infrastructure';
import { Knex } from 'knex';
import { DomainEvent } from '../../domain/domainEvents/DomainEvent';
import { EventPublisher } from '../../domain/domainEvents/eventPublisher';

export type UnitOfWork = {
  id: string;
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
