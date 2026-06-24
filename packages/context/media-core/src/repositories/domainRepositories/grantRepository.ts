import { Operation } from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
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

export interface GrantRepository extends RequestScopeLifeCycle {
  createGrant: (grant: GrantRecord) => Promise<void>;
  createGrants: (grants: GrantRecord[]) => Promise<void>;
  deleteGrantsByAccessGrantAndMediaItem: (
    authorizationIds: EntityId[],
    mediaItemIds: EntityId[],
  ) => Promise<void>;
  deleteGrantsBySourceId: (sourceId: EntityId) => Promise<void>;
  deleteGrantsByAlbumId: (albumId: EntityId) => Promise<void>;
}

type GrantRepositoryDeps = {
  uow: UnitOfWork;
};
export const build__GrantRepository = ({ uow }: GrantRepositoryDeps): GrantRepository => ({
  createGrant: async (grant: GrantRecord): Promise<void> => {
    const input = prepareForDatabase(grant);
    await uow
      ?.db()('grant')
      .insert(input)
      .onConflict(['mediaItemId', 'accessGrantId'])
      .merge(['operations']); // ← only this column updates on conflict;
  },

  createGrants: async (grants: GrantRecord[]): Promise<void> => {
    const input = prepareForDatabase(grants);
    await uow
      ?.db()('grant')
      .insert(input)
      .onConflict(['mediaItemId', 'accessGrantId'])
      .merge(['operations']); // ← only this column updates on conflict;
  },

  deleteGrantsByAccessGrantAndMediaItem: async (
    authorizationIds: EntityId[],
    mediaItemIds: EntityId[],
  ): Promise<void> => {
    await uow
      ?.db()('grant')
      .whereIn('accessGrantId', authorizationIds)
      .whereIn('mediaItemId', mediaItemIds)
      .delete();
  },

  deleteGrantsBySourceId: async (sourceId: EntityId): Promise<void> => {
    await uow?.db()('grant').where({ sourceId }).delete();
  },

  deleteGrantsByAlbumId: async (albumId: EntityId): Promise<void> => {
    await uow?.db()('grant').where({ sourceAlbumId: albumId }).delete();
  },
});
