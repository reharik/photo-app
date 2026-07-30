import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemAlbumItemRepository = {
  getItemsByAlbumIds: (
    albumId: EntityId[],
  ) => Promise<
    { id: EntityId; albumId: EntityId; mediaItemId: EntityId; mediaItemOwnerId: EntityId }[]
  >;
};

type SystemAlbumItemRepositoryDeps = {
  database: Knex;
};

export const build__SystemAlbumItemRepository = ({
  database,
}: SystemAlbumItemRepositoryDeps): SystemAlbumItemRepository => ({
  getItemsByAlbumIds: async (albumIds: EntityId[]) => {
    return database('albumItem')
      .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
      .select<
        { id: EntityId; albumId: EntityId; mediaItemId: EntityId; mediaItemOwnerId: EntityId }[]
      >(['albumItem.id', 'albumItem.albumId', 'albumItem.mediaItemId', 'mediaItem.ownerId'])
      .whereIn('albumId', albumIds);
  },
});
