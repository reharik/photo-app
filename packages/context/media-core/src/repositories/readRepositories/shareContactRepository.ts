import type { Knex } from 'knex';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';

export type ShareContactSuggestion = {
  userId: EntityId;
  handle: string;
};

type ShareContactRow = {
  userId: EntityId;
  contactUserId: EntityId;
  handle: string;
  lastSharedAt: Date;
};

export type ShareContactRepository = {
  upsertContact: (
    userId: EntityId,
    contactUserId: EntityId,
    handle: string,
    options: RepoOptions,
  ) => Promise<void>;
  getShareSuggestions: (userId: EntityId) => Promise<ShareContactSuggestion[]>;
};

type ShareContactRepositoryDeps = { database: Knex };

export const build__ShareContactRepository = ({
  database,
}: ShareContactRepositoryDeps): ShareContactRepository => ({
  upsertContact: async (
    userId: EntityId,
    contactUserId: EntityId,
    handle: string,
    options: RepoOptions,
  ): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      await trx<ShareContactRow>('shareContact')
        .insert({
          userId,
          contactUserId,
          handle,
          lastSharedAt: new Date(),
        })
        .onConflict(['user_id', 'contact_user_id'])
        .merge(['handle', 'lastSharedAt']);
    });
  },

  getShareSuggestions: async (userId: EntityId): Promise<ShareContactSuggestion[]> => {
    const rows = await database<ShareContactRow>('shareContact')
      .where({ userId })
      .orderBy('lastSharedAt', 'desc')
      .select<{ contactUserId: EntityId; handle: string }[]>('contactUserId', 'handle');

    return rows.map((row) => ({ userId: row.contactUserId, handle: row.handle }));
  },
});
