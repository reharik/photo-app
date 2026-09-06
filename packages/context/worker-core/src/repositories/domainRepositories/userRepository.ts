import { AuthorizationKind, notEmpty, Operation, UserStatus } from '@packages/contracts';
import { groupByMapping } from '@packages/infrastructure';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { UserAuthorizationRecord } from '../../domain';
import { PendingUser } from '../../domain/User/PendingUser';
import { UserRecord } from '../../domain/User/types';
import { User } from '../../domain/User/User';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import type { EntityId } from '../../types/types';
import { withLiveAuthorizationFilter } from '../queryHelpers';
import { Persist } from './AggregateRepo';

export interface UserRepository extends RequestScopeLifeCycle {
  getById: (id: EntityId) => Promise<User | undefined>;
  getByHandle: (handle: string) => Promise<User | undefined>;
  getUserByEmail: (email: string) => Promise<User | PendingUser | undefined>;
  getAllUsersByEmail: (handles: string[]) => Promise<(User | PendingUser)[]>;
  save: (user: User | PendingUser) => Promise<void>;
}

type UserRepositoryDeps = { uow: UnitOfWork; persist: Persist };

export const build__UserRepository = ({ uow, persist }: UserRepositoryDeps): UserRepository => {
  const getById = async (id: EntityId): Promise<User | undefined> => {
    await uow.join();
    const userRow = await uow.db()<UserRecord>('user').where({ id }).first();

    if (!userRow) {
      return;
    }

    return User.rehydrate(userRow);
  };

  const getByHandle = async (handle: string): Promise<User | undefined> => {
    // using email for handle for now.
    await uow.join();
    const userRow = await uow.db()<UserRecord>('user').where({ email: handle }).first();

    if (!userRow) {
      return;
    }

    return User.rehydrate(userRow);
  };

  const getAllUsersByEmail = async (handles: string[]): Promise<(User | PendingUser)[]> => {
    await uow.join();
    const users = await withEnumRevival(
      uow
        .db()<UserRecord>('user')
        .whereIn(
          'email',
          handles.map((x) => x.trim().toLowerCase()),
        ),
      { userStatus: UserStatus },
    );

    const pendingIds = users
      .filter((x) => x.userStatus.equals(UserStatus.pending))
      .map((x) => x.id);

    const authorizationRows = await withEnumRevival(
      uow
        .db()('access_grant')
        .whereIn('grantedToUser', pendingIds)
        // .modify()'s type params don't infer from the receiver; without them the row type
        // erases to `any` and withEnumRevival stops checking mapping keys.
        .modify<UserAuthorizationRecord, UserAuthorizationRecord[]>(
          withLiveAuthorizationFilter(uow.db()),
        )
        .orderBy('createdAt', 'asc'),
      { operations: Operation, kind: AuthorizationKind },
    );
    const authzMap = groupByMapping(authorizationRows, (x) => x.grantedToUser);

    return users.filter(notEmpty).map((x) =>
      x.userStatus.equals(UserStatus.active)
        ? User.rehydrate(x)
        : PendingUser.rehydrate(
            x,
            (authzMap.get(x.id) ?? []).map((a) => ({ authorizationId: a.id, albumId: a.albumId })),
          ),
    );
  };

  // This is used at login but if the user is pending then we get the authorizations
  // in order to convert
  const getUserByEmail = async (email: string): Promise<User | PendingUser | undefined> => {
    await uow.join();
    const userRow = await withEnumRevival(
      uow.db()('user').where({ email: email.trim().toLowerCase() }).first<UserRecord>(),
      { userStatus: UserStatus },
    );

    if (!userRow) {
      return;
    }
    if (userRow.userStatus.equals(UserStatus.active)) {
      return User.rehydrate(userRow);
    }
    const authorizationRefs = await uow
      .db()('access_grant')
      .where({ grantedToUser: userRow.id })
      .where({ kind: AuthorizationKind.pending.value })
      .modify(withLiveAuthorizationFilter(uow.db()))
      .select<{ authorizationId: string; albumId: string }[]>(['id as authorizationId', 'albumId']);
    return PendingUser.rehydrate(userRow, authorizationRefs);
  };

  const save = async (user: User | PendingUser): Promise<void> => {
    await persist(user);
  };

  return {
    getById,
    getByHandle,
    getUserByEmail,
    getAllUsersByEmail,
    save,
  };
};
