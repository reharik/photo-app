import { EntityId, MediaItemStatus, MediaKind } from '@packages/contracts';
import { RequestScopeLifeCycle } from '@packages/infrastructure';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { UnitOfWork } from '../../infrastructure';
import { AlbumItemWithMediaRow } from '../../services';
import { albumItemWithMediaSelectColumns } from '../readRepositories/albumItemReadRepository';

export interface SystemAlbumItemRepository extends RequestScopeLifeCycle {
  getItemsByAlbumIds: (
    albumId: EntityId[],
  ) => Promise<
    { id: EntityId; albumId: EntityId; mediaItemId: EntityId; mediaItemOwnerId: EntityId }[]
  >;
  getAlbumItemsByIds: ({
    albumId,
    albumItemIds,
  }: {
    albumId: EntityId;
    albumItemIds: EntityId[];
  }) => Promise<AlbumItemWithMediaRow[]>;
}

type SystemAlbumItemRepositoryDeps = {
  uow: UnitOfWork;
};

export const build__SystemAlbumItemRepository = ({
  uow,
}: SystemAlbumItemRepositoryDeps): SystemAlbumItemRepository => ({
  getItemsByAlbumIds: async (albumIds: EntityId[]) => {
    return uow
      .db()('albumItem')
      .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
      .select<
        { id: EntityId; albumId: EntityId; mediaItemId: EntityId; mediaItemOwnerId: EntityId }[]
      >(['albumItem.id', 'albumItem.albumId', 'albumItem.mediaItemId', 'mediaItem.ownerId'])
      .whereIn('albumId', albumIds);
  },
  getAlbumItemsByIds: async ({
    albumId,
    albumItemIds,
  }: {
    albumId: EntityId;
    albumItemIds: EntityId[];
  }) => {
    return withEnumRevival(
      uow
        .db()('albumItem')
        .innerJoin('album', 'albumItem.albumId', 'album.id')
        .leftJoin('albumMember', 'albumMember.albumId', 'album.id')
        .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
        .where('album.id', albumId)
        .whereIn('albumItem.id', albumItemIds)
        .select<AlbumItemWithMediaRow[]>(...albumItemWithMediaSelectColumns(uow.db())),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
    );
  },
});
