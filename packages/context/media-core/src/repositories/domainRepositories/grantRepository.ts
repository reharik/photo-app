import { Operation } from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import type { Knex } from 'knex';
import type { EntityId } from '../../types/types';

export type GrantRecord = {
  id: EntityId;
  mediaItemId: EntityId;
  accessGrantId: EntityId;
  grantedToUser?: EntityId;
  operations?: Operation[];
  createdAt: Date;
};

export type GrantRepository = {
  createGrant: (grant: GrantRecord, trx: Knex.Transaction) => Promise<void>;
  createGrants: (grants: GrantRecord[], trx: Knex.Transaction) => Promise<void>;
  deleteGrantsBySourceId: (sourceId: EntityId, trx: Knex.Transaction) => Promise<void>;
  deleteGrantsByAlbumId: (albumId: EntityId, trx: Knex.Transaction) => Promise<void>;
};

export const build__GrantRepository = (): GrantRepository => ({
  createGrant: async (grant: GrantRecord, trx: Knex.Transaction): Promise<void> => {
    const input = prepareForDatabase(grant);
    await trx('grant').insert(input);
  },

  createGrants: async (grants: GrantRecord[], trx: Knex.Transaction): Promise<void> => {
    const input = prepareForDatabase(grants);
    await trx('grant').insert(input);
  },

  deleteGrantsBySourceId: async (sourceId: EntityId, trx: Knex.Transaction): Promise<void> => {
    await trx('grant').where({ sourceId }).delete();
  },

  deleteGrantsByAlbumId: async (albumId: EntityId, trx: Knex.Transaction): Promise<void> => {
    await trx('grant').where({ sourceAlbumId: albumId }).delete();
  },
});
