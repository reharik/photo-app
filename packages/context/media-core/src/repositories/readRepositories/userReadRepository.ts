import { UserStatus } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { UserRow } from '../../services';
import type { EntityId } from '../../types/types';
import type { ReadRepositoryDeps, UserReadRepository } from './types';

export const build__UserReadRepository = ({
  database,
}: ReadRepositoryDeps): UserReadRepository => ({
  getById: async (userId: EntityId): Promise<UserRow | undefined> => {
    return await withEnumRevival(database<UserRow>('User').where({ id: userId }).first(), {
      userStatus: UserStatus,
    });
  },
  getByIds: async (userIds: EntityId[]): Promise<UserRow[]> => {
    return await withEnumRevival(database<UserRow>('User').whereIn('id', userIds), {
      userStatus: UserStatus,
    });
  },
});
