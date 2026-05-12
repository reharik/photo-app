import { User } from '@packages/contracts';
import type { Knex } from 'knex';
import type { EntityId } from '../../types/types';

export type UserReadRepository = {
  getById: (userId: EntityId) => Promise<User | undefined>;
};

export const build__UserReadRepository = ({
  database,
}: {
  database: Knex;
}): UserReadRepository => ({
  getById: async (userId: EntityId): Promise<User | undefined> => {
    return database<User>('User').where({ id: userId }).first();
  },
});
