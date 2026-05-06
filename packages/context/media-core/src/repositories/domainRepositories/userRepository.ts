import type { Knex } from 'knex';
import type { UserRecord } from '../../domain/User/User';
import { User } from '../../domain/User/User';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';

export type UserRepository = {
  getById: (id: EntityId) => Promise<User | undefined>;
  getByHandle: (handle: string) => Promise<User | undefined>;
  save: (user: User, options?: RepoOptions) => Promise<void>;
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

  const save = async (user: User, options?: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      const record = user.toPersistence();

      const existing = await trx<UserRecord>('user').where({ id: record.id }).first();

      if (existing) {
        await trx<UserRecord>('user').where({ id: record.id }).update(record);
      } else {
        await trx<UserRecord>('user').insert(record);
      }
    });
  };

  return {
    getById,
    getByHandle,
    save,
  };
};
