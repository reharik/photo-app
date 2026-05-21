import { Operation } from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import type { Knex } from 'knex';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';

export type GrantRecord = {
  id: EntityId;
  mediaItemId: EntityId;
  accessGrantId?: EntityId;
  grantedToUser?: EntityId;
  operations?: Operation[];
  createdAt: Date;
};

export type GrantRepository = {
  createGrant: (grant: GrantRecord, options: RepoOptions) => Promise<void>;
  createGrants: (grants: GrantRecord[], options: RepoOptions) => Promise<void>;
  deleteGrantsBySourceId: (sourceId: EntityId, options: RepoOptions) => Promise<void>;
  deleteGrantsByAlbumId: (albumId: EntityId, options: RepoOptions) => Promise<void>;
};

type GrantRepositoryDeps = { database: Knex };

export const build__GrantRepository = ({ database }: GrantRepositoryDeps): GrantRepository => ({
  createGrant: async (grant: GrantRecord, options: RepoOptions): Promise<void> => {
    const input = prepareForDatabase(grant);
    await runInTransaction(database, options, async (trx) => {
      await trx('grant').insert(input);
    });
  },

  createGrants: async (grants: GrantRecord[], options: RepoOptions): Promise<void> => {
    const input = prepareForDatabase(grants);
    await runInTransaction(database, options, async (trx) => {
      await trx('grant').insert(input);
    });
  },

  deleteGrantsBySourceId: async (sourceId: EntityId, options: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      await trx('grant').where({ sourceId }).delete();
    });
  },

  deleteGrantsByAlbumId: async (albumId: EntityId, options: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      await trx('grant').where({ sourceAlbumId: albumId }).delete();
    });
  },
});
