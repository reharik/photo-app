import type { EntityId } from '@packages/contracts';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import type { ReadRepositoryDeps, ShareContactRow, ShareContactSuggestion } from './types';

export interface ShareContactReadRepository extends RequestScopeLifeCycle {
  getShareSuggestions: (userId: EntityId) => Promise<ShareContactSuggestion[]>;
}

export const build__ShareContactReadRepository = ({
  uow,
}: ReadRepositoryDeps): ShareContactReadRepository => ({
  getShareSuggestions: async (userId: EntityId): Promise<ShareContactSuggestion[]> => {
    const rows = await uow
      .db()<ShareContactRow>('shareContact')
      .where({ userId })
      .orderBy('lastSharedAt', 'desc')
      .select<{ contactUserId: EntityId; handle: string }[]>('contactUserId', 'handle');

    return rows.map((row) => ({ userId: row.contactUserId, handle: row.handle }));
  },
});
