import type { EntityId } from '../../types/types';
import type { ReadRepositoryDeps, ShareContactRow, ShareContactSuggestion } from './types';

export type ShareContactReadRepository = {
  getShareSuggestions: (userId: EntityId) => Promise<ShareContactSuggestion[]>;
};

export const build__ShareContactReadRepository = ({
  uow,
}: ReadRepositoryDeps): ShareContactReadRepository => ({
  getShareSuggestions: async (userId: EntityId): Promise<ShareContactSuggestion[]> => {
    await uow.join();
    const rows = await uow
      .db()<ShareContactRow>('shareContact')
      .where({ userId })
      .orderBy('lastSharedAt', 'desc')
      .select<{ contactUserId: EntityId; handle: string }[]>('contactUserId', 'handle');

    return rows.map((row) => ({ userId: row.contactUserId, handle: row.handle }));
  },
});
