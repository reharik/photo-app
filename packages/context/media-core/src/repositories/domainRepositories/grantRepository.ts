import { Operation } from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import type { Knex } from 'knex';
import type { EntityId } from '../../types/types';

export type GrantRecord = {
  id: EntityId;
  mediaItemId: EntityId;
  accessGrantId: EntityId;
  grantedToUser?: EntityId | null;
  shareLinkId?: EntityId | null;
  operations?: Operation[];
  createdAt: Date;
};

export type GrantRepository = {
  createGrant: (grant: GrantRecord, trx: Knex.Transaction) => Promise<void>;
  createGrants: (grants: GrantRecord[], trx: Knex.Transaction) => Promise<void>;
  deleteGrantsByAccessGrantAndMediaItem: (
    authorizationIds: EntityId[],
    mediaItemIds: EntityId[],
    trx: Knex.Transaction,
  ) => Promise<void>;
  deleteGrantsBySourceId: (sourceId: EntityId, trx: Knex.Transaction) => Promise<void>;
  deleteGrantsByAlbumId: (albumId: EntityId, trx: Knex.Transaction) => Promise<void>;
};

export const build__GrantRepository = (): GrantRepository => ({
  createGrant: async (grant: GrantRecord, trx: Knex.Transaction): Promise<void> => {
    const input = prepareForDatabase(grant);
    await trx('grant')
      .insert(input)
      .onConflict(['mediaItemId', 'accessGrantId'])
      .merge(['operations']); // ← only this column updates on conflict;
  },

  createGrants: async (grants: GrantRecord[], trx: Knex.Transaction): Promise<void> => {
    const input = prepareForDatabase(grants);
    await trx('grant')
      .insert(input)
      .onConflict(['mediaItemId', 'accessGrantId'])
      .merge(['operations']); // ← only this column updates on conflict;
  },

  deleteGrantsByAccessGrantAndMediaItem: async (
    authorizationIds: EntityId[],
    mediaItemIds: EntityId[],
    trx: Knex.Transaction,
  ): Promise<void> => {
    await trx('grant')
      .whereIn('accessGrantId', authorizationIds)
      .whereIn('mediaItemId', mediaItemIds)
      .delete();
  },

  deleteGrantsBySourceId: async (sourceId: EntityId, trx: Knex.Transaction): Promise<void> => {
    await trx('grant').where({ sourceId }).delete();
  },

  deleteGrantsByAlbumId: async (albumId: EntityId, trx: Knex.Transaction): Promise<void> => {
    await trx('grant').where({ sourceAlbumId: albumId }).delete();
  },
});
