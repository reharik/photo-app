import { AlbumItemSortBy, MediaItemStatus, MediaKind } from '@packages/contracts';
import { RequestScopeLifeCycle } from '@packages/infrastructure';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { UnitOfWork } from '../../infrastructure';
import { AlbumItemWithMediaRow, PagedList } from '../../services/readServices/types';
import { CollectionInfo } from '../../types/types';
import {
  toPagedResult,
  withAlbumItemViewableByMemberOrGrant,
  withAttachViewerMembership,
  withCollectionInfo,
} from '../queryHelpers';
import { withActivePublicLink } from '../queryHelpers/withActivePublicLink';

export interface AlbumItemReadRepository extends RequestScopeLifeCycle {
  /** Album items for public share-link viewing (no membership check). READY media only. */
  listAlbumItemsForPublicLink: ({
    albumId,
    publicLinkId,
    collectionInfo,
  }: {
    albumId: string;
    publicLinkId: string;
    collectionInfo: CollectionInfo<AlbumItemSortBy>;
  }) => Promise<PagedList<AlbumItemWithMediaRow>>;
  getViewableAlbumItemsForViewer: ({
    albumId,
    viewerId,
    collectionInfo,
  }: {
    albumId: string;
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumItemSortBy>;
  }) => Promise<PagedList<AlbumItemWithMediaRow>>;
  getAlbumItemsByIds: ({
    albumId,
    albumItemIds,
  }: {
    albumId: string;
    albumItemIds: string[];
  }) => Promise<AlbumItemWithMediaRow[]>;
}

const mediaItemSelectColumns = [
  'mediaItem.id as mediaItemId',
  'mediaItem.ownerId as mediaItemOwnerId',
  'mediaItem.kind as mediaItemKind',
  'mediaItem.status as mediaItemStatus',
  'mediaItem.mimeType as mediaItemMimeType',
  'mediaItem.sizeBytes as mediaItemSizeBytes',
  'mediaItem.originalFileName as mediaItemOriginalFileName',
  'mediaItem.width as mediaItemWidth',
  'mediaItem.height as mediaItemHeight',
  'mediaItem.durationSeconds as mediaItemDurationSeconds',
  'mediaItem.title as mediaItemTitle',
  'mediaItem.description as mediaItemDescription',
  'mediaItem.takenAt as mediaItemTakenAt',
  'mediaItem.createdAt as mediaItemCreatedAt',
  'mediaItem.updatedAt as mediaItemUpdatedAt',
  'mediaItem.reactionCounts as mediaItemReactionCounts',
];

// order_index is bigint and can exceed 2^53, where the int8 -> number type parser throws;
// read it as text so it stays an exact string end to end.
export const albumItemWithMediaSelectColumns = (db: Knex): (string | Knex.Raw)[] => [
  'albumItem.id',
  db.raw('??::text as ??', ['albumItem.orderIndex', 'albumItemOrderIndex']),
  'albumItem.createdAt',
  'albumItem.updatedAt',
  ...mediaItemSelectColumns,
];

type AlbumItemReadRepositoryDeps = { uow: UnitOfWork };

export const build__AlbumItemReadRepository = ({
  uow,
}: AlbumItemReadRepositoryDeps): AlbumItemReadRepository => ({
  getViewableAlbumItemsForViewer: async ({
    albumId,
    viewerId,
    collectionInfo,
  }: {
    albumId: string;
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumItemSortBy>;
  }): Promise<PagedList<AlbumItemWithMediaRow>> => {
    const rows = (await withEnumRevival(
      uow
        .db()('albumItem')
        .innerJoin('album', 'albumItem.albumId', 'album.id')
        .modify(withAttachViewerMembership(uow.db(), viewerId))
        .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
        .where('album.id', albumId)
        .andWhere('mediaItem.status', MediaItemStatus.ready)
        .modify(withAlbumItemViewableByMemberOrGrant(uow.db(), viewerId))
        .select(...albumItemWithMediaSelectColumns(uow.db()))
        .modify(withCollectionInfo(uow.db(), collectionInfo)),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
    )) as (AlbumItemWithMediaRow & { totalCount: number })[];
    return toPagedResult(rows);
  },

  listAlbumItemsForPublicLink: async ({
    albumId,
    publicLinkId,
    collectionInfo,
  }: {
    albumId: string;
    publicLinkId: string;
    collectionInfo: CollectionInfo<AlbumItemSortBy>;
  }): Promise<PagedList<AlbumItemWithMediaRow>> => {
    const query = uow
      .db()('albumItem')
      .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
      .where('albumItem.albumId', albumId)
      .where('mediaItem.status', MediaItemStatus.ready.value)
      .modify(withActivePublicLink(uow.db(), albumId, publicLinkId))
      .modify(withCollectionInfo(uow.db(), collectionInfo))
      .select<(AlbumItemWithMediaRow & { totalCount: number })[]>(
        ...albumItemWithMediaSelectColumns(uow.db()),
      );

    const rows = await withEnumRevival(query, {
      mediaItemKind: MediaKind,
      mediaItemStatus: MediaItemStatus,
    });

    return toPagedResult(rows);
  },
  getAlbumItemsByIds: async ({
    albumId,
    albumItemIds,
  }: {
    albumId: string;
    albumItemIds: string[];
  }): Promise<AlbumItemWithMediaRow[]> => {
    return withEnumRevival(
      uow
        .db()('albumItem')
        .innerJoin('album', 'albumItem.albumId', 'album.id')
        .leftJoin('albumMember', 'albumMember.albumId', 'album.id')
        .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
        .where({ 'album.id': albumId, 'mediaItem.status': MediaItemStatus.ready })
        .whereIn('albumItem.id', albumItemIds)
        .select<AlbumItemWithMediaRow[]>(...albumItemWithMediaSelectColumns(uow.db())),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
    );
  },
});
