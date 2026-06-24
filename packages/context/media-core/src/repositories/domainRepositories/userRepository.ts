import type { UserRecord } from '../../domain/User/User';
import { User } from '../../domain/User/User';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import type { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';

export interface UserRepository extends RequestScopeLifeCycle {
  getById: (id: EntityId) => Promise<User | undefined>;
  getByHandle: (handle: string) => Promise<User | undefined>;
  save: (user: User) => Promise<void>;
}

type UserRepositoryDeps = { uow: UnitOfWork };

export const build__UserRepository = ({ uow }: UserRepositoryDeps): UserRepository => {
  const getById = async (id: EntityId): Promise<User | undefined> => {
    const userRow = await uow.db()<UserRecord>('user').where({ id }).first();

    if (!userRow) {
      return;
    }

    return User.rehydrate(userRow);
  };

  const getByHandle = async (handle: string): Promise<User | undefined> => {
    // using email for handle for now.
    const userRow = await uow.db()<UserRecord>('user').where({ email: handle }).first();

    if (!userRow) {
      return;
    }

    return User.rehydrate(userRow);
  };

  const save = async (user: User): Promise<void> => {
    await persist(user, uow);
  };

  return {
    getById,
    getByHandle,
    save,
  };
};
