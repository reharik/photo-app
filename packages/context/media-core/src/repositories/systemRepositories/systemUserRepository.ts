import { UserStatus } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import { EntityId } from '../../types';

export interface SystemUserRepository extends RequestScopeLifeCycle {
  getUserContacts: (userIds: EntityId[]) => Promise<UserContact[]>;
  getActiveUsers: (userIds: EntityId[]) => Promise<UserContact[]>;
}

export type SystemUserRepositoryDeps = {
  uow: UnitOfWork;
};

export type UserContact = {
  id: EntityId;
  email: string;
  firstName?: string;
  lastName?: string;
  userStatus: UserStatus;
};

const UserFields = ['id', 'email', 'firstName', 'lastName', 'userStatus'];

export const build__SystemUserRepository = ({
  uow,
}: SystemUserRepositoryDeps): SystemUserRepository => ({
  getUserContacts: async (userIds: EntityId[]) => {
    await uow.join();
    return withEnumRevival(uow.db()('User').select(UserFields).whereIn('id', userIds), {
      userStatus: UserStatus,
    });
  },
  getActiveUsers: async (userIds: EntityId[]) => {
    await uow.join();
    return withEnumRevival(
      uow
        .db()('User')
        .select<UserContact[]>(UserFields)
        .whereIn('id', userIds)
        .andWhere({ userStatus: UserStatus.active.value }),
      { userStatus: UserStatus },
    );
  },
});
