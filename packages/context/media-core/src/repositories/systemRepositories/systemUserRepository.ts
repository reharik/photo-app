import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemUserRepository = {
  getUsersEmail: (userIds: EntityId[]) => Promise<UserEmail[]>;
};

export type SystemUserRepositoryDeps = {
  database: Knex;
};

type UserEmail = {
  id: EntityId;
  emailAddress: string;
};
const UserFields = ['id', 'email'];

export const build__SystemUserRepository = ({
  database,
}: SystemUserRepositoryDeps): SystemUserRepository => ({
  getUsersEmail: (userIds: EntityId[]) => {
    return database('User').select(UserFields).whereIn('id', userIds);
  },
});
