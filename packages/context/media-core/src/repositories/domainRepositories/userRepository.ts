import type { Knex } from 'knex';
import type { UserRecord } from '../../domain/User/User';
import { User } from '../../domain/User/User';
import type { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';

export type UserRepository = {
  getById: (id: EntityId) => Promise<User | undefined>;
  getByHandle: (handle: string) => Promise<User | undefined>;
  save: (user: User, trx: Knex.Transaction) => Promise<void>;
};

type UserRepositoryDeps = { database: Knex };

export const build__UserRepository = ({ database }: UserRepositoryDeps): UserRepository => {
  const getById = async (id: EntityId): Promise<User | undefined> => {
    const userRow = await database<UserRecord>('user').where({ id }).first();

    if (!userRow) {
      return;
    }

    return User.rehydrate(userRow);
  };

  const getByHandle = async (handle: string): Promise<User | undefined> => {
    // using email for handle for now.
    const userRow = await database<UserRecord>('user').where({ email: handle }).first();

    if (!userRow) {
      return;
    }

    return User.rehydrate(userRow);
  };

  const save = async (user: User, trx: Knex.Transaction): Promise<void> => {
    await persist(trx, user);
  };

  return {
    getById,
    getByHandle,
    save,
  };
};
