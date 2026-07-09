import { Operation, UserStatus } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { AuthorizationRecord } from '../../domain';
import { PendingUser } from '../../domain/User/PendingUser';
import { UserRecord } from '../../domain/User/types';
import { User } from '../../domain/User/User';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import type { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';

export interface UserRepository extends RequestScopeLifeCycle {
  getById: (id: EntityId) => Promise<User | undefined>;
  getByHandle: (handle: string) => Promise<User | undefined>;
  getUserByEmail: (email: string) => Promise<User | PendingUser | undefined>;
  save: (user: User | PendingUser) => Promise<void>;
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

  const getUserByEmail = async (email: string): Promise<User | PendingUser | undefined> => {
    const userRow = await withEnumRevival(
      uow.db()('user').where({ email }).first<UserRecord>(),
      { userStatus: UserStatus },
      { strict: true },
    );

    if (!userRow) {
      return;
    }
    if (userRow.userStatus.equals(UserStatus.active)) {
      return User.rehydrate(userRow);
    }
    const authorizationRows = await withEnumRevival(
      uow
        .db()<AuthorizationRecord>('access_grant')
        .where({ grantedToUser: userRow.id })
        .orderBy('createdAt', 'asc'),
      { operation: Operation },
      { strict: true },
    );
    return PendingUser.rehydrate(userRow, { authorizations: authorizationRows });
  };

  const save = async (user: User | PendingUser): Promise<void> => {
    await persist(user, uow);
  };

  return {
    getById,
    getByHandle,
    getUserByEmail,
    save,
  };
};
