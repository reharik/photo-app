import { UserStatus } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { UserRow } from '../../services';
import type { EntityId } from '../../types/types';
import type { ReadRepositoryDeps, UserReadRepository } from './types';

export const build__UserReadRepository = ({ uow }: ReadRepositoryDeps): UserReadRepository => ({
  getById: async (userId: EntityId): Promise<UserRow | undefined> => {
    await uow.join();
    return await withEnumRevival(uow.db()<UserRow>('User').where({ id: userId }).first(), {
      userStatus: UserStatus,
    });
  },
  getByIds: async (userIds: EntityId[]): Promise<UserRow[]> => {
    await uow.join();
    return await withEnumRevival(uow.db()<UserRow>('User').whereIn('id', userIds), {
      userStatus: UserStatus,
    });
  },
  getByEmails: async (emails: string[]): Promise<UserRow[]> => {
    await uow.join();
    return await withEnumRevival(uow.db()<UserRow>('User').whereIn('email', emails), {
      userStatus: UserStatus,
    });
  },
});
