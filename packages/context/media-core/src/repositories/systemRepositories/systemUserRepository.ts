import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemUserRepository = {
  getUserContacts: (userIds: EntityId[]) => Promise<UserContact[]>;
};

export type SystemUserRepositoryDeps = {
  database: Knex;
};

export type UserContact = {
  id: EntityId;
  email: string;
  firstName?: string;
  lastName?: string;
};

const UserFields = ['id', 'email', 'firstName', 'lastName'];

export const build__SystemUserRepository = ({
  database,
}: SystemUserRepositoryDeps): SystemUserRepository => ({
  getUserContacts: (userIds: EntityId[]) => {
    return database('User').select(UserFields).whereIn('id', userIds);
  },
});
