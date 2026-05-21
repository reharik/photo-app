import { User } from '@packages/contracts';
import type { EntityId } from '../../types/types';
import type { ReadRepositoryDeps, UserReadRepository } from './types';

export const build__UserReadRepository = ({
  database,
}: ReadRepositoryDeps): UserReadRepository => ({
  getById: async (userId: EntityId): Promise<User | undefined> => {
    return database<User>('User').where({ id: userId }).first();
  },
});
