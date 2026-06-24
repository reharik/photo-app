import { Knex } from 'knex';

export type UnitOfWork = {
  id: string;
  start: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  db: () => Knex.Transaction;
};

type UnitOfWorkDeps = {
  database: Knex;
};

export const build__UnitOfWork = ({ database }: UnitOfWorkDeps): UnitOfWork => {
  const id = crypto.randomUUID();
  let trx: Knex.Transaction | undefined;
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
    },
    rollback: async () => {
      if (!trx) throw new Error('Transaction not started');
      await trx?.rollback();
    },
  };
};
