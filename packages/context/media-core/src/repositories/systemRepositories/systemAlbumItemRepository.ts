import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemAlbumItemRepository = {
  getItemsByAlbumIds: (
    albumId: EntityId[],
  ) => Promise<{ id: EntityId; albumId: EntityId; mediaItemId: EntityId }[]>;
};

type SystemAlbumItemRepositoryDeps = {
  database: Knex;
};

export const build__SystemAlbumItemRepository = ({
  database,
}: SystemAlbumItemRepositoryDeps): SystemAlbumItemRepository => ({
  getItemsByAlbumIds: async (albumIds: EntityId[]) => {
    return database('albumItem')
      .select<{ id: EntityId; albumId: EntityId; mediaItemId: EntityId }[]>([
        'id',
        'albumId',
        'mediaItemId',
      ])
      .whereIn('albumId', albumIds);
  },
});
