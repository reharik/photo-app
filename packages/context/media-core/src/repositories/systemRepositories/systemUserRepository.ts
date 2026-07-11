import { UserStatus } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemUserRepository = {
  getUserContacts: (userIds: EntityId[]) => Promise<UserContact[]>;
  getActiveUsers: (userIds: EntityId[]) => Promise<UserContact[]>;
};

export type SystemUserRepositoryDeps = {
  database: Knex;
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
  database,
}: SystemUserRepositoryDeps): SystemUserRepository => ({
  getUserContacts: (userIds: EntityId[]) => {
    return withEnumRevival(
      database('User').select(UserFields).whereIn('id', userIds),
      { userStatus: UserStatus },
      { strict: true },
    );
  },
  getActiveUsers: (userIds: EntityId[]) => {
    return withEnumRevival(
      database('User')
        .select<UserContact[]>(UserFields)
        .whereIn('id', userIds)
        .andWhere({ userStatus: UserStatus.active.value }),
      { userStatus: UserStatus },
      { strict: true },
    );
  },
});
