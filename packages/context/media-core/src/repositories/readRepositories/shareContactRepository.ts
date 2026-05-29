import { Knex } from 'knex';
import type { EntityId } from '../../types/types';
import type {
  ReadRepositoryDeps,
  ShareContactRepository,
  ShareContactRow,
  ShareContactSuggestion,
} from './types';

export const build__ShareContactRepository = ({
  database,
}: ReadRepositoryDeps): ShareContactRepository => ({
  upsertContact: async (
    userId: EntityId,
    contactUserId: EntityId,
    handle: string,
    trx: Knex.Transaction,
  ): Promise<void> => {
    await trx<ShareContactRow>('shareContact')
      .insert({
        userId,
        contactUserId,
        handle,
        lastSharedAt: new Date(),
      })
      .onConflict(['user_id', 'contact_user_id'])
      .merge(['handle', 'lastSharedAt']);
  },

  getShareSuggestions: async (userId: EntityId): Promise<ShareContactSuggestion[]> => {
    const rows = await database<ShareContactRow>('shareContact')
      .where({ userId })
      .orderBy('lastSharedAt', 'desc')
      .select<{ contactUserId: EntityId; handle: string }[]>('contactUserId', 'handle');

    return rows.map((row) => ({ userId: row.contactUserId, handle: row.handle }));
  },
});
