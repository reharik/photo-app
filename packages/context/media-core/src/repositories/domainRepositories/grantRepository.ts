import type { Knex } from 'knex';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';

export type GrantRecord = {
  id: EntityId;
  mediaItemId: EntityId;
  accessGrantId?: EntityId;
  grantedToUser?: EntityId;
  createdAt: Date;
};

export type GrantRepository = {
  createGrant: (grant: GrantRecord, options: RepoOptions) => Promise<void>;
  deleteGrantsBySourceId: (sourceId: EntityId, options: RepoOptions) => Promise<void>;
  deleteGrantsByAlbumId: (albumId: EntityId, options: RepoOptions) => Promise<void>;
};

type GrantRepositoryDeps = { database: Knex };

export const buildGrantRepository = ({ database }: GrantRepositoryDeps): GrantRepository => ({
  createGrant: async (grant: GrantRecord, options: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      await trx<GrantRecord>('grant').insert(grant);
    });
  },

  deleteGrantsBySourceId: async (sourceId: EntityId, options: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      await trx<GrantRecord>('grant').where({ sourceId }).delete();
    });
  },

  deleteGrantsByAlbumId: async (albumId: EntityId, options: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      await trx<GrantRecord>('grant').where({ sourceAlbumId: albumId }).delete();
    });
  },
});
