import {
  AlbumItemSortBy,
  AlbumMemberRole,
  AlbumSortBy,
  MediaItemStatus,
  MediaKind,
} from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import {
  AlbumItemWithMediaRow,
  AlbumWithCoverRow,
  PagedList,
} from '../../services/readServices/types';
import { CollectionInfo } from '../../types/types';
import {
  toPagedResult,
  withAlbumCoverItem,
  withAlbumItemCount,
  withAlbumItemViewableByMemberOrItemGrant,
  withCollectionInfo,
  withUnseenAlbumFlag,
  withViewableByMemberOrAlbumGrant,
  withViewerMembership,
} from '../queryHelpers';
import { withActiveShareLink } from '../queryHelpers/withActiveShareLink';
import type { AlbumIdRow, AlbumReadRepository, ReadRepositoryDeps } from './types';

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

const publicAlbumFields = [
  'album.id as id',
  'album.title as title',
  'album.createdAt as createdAt',
  'album.updatedAt as updatedAt',
];

const albumFields = [...publicAlbumFields, 'albumMember.role as viewerMemberRole'];

const albumItemWithMediaSelectColumns = [
  'albumItem.id',
  'albumItem.orderIndex as albumItemOrderIndex',
  'albumItem.createdAt',
  'albumItem.updatedAt',
  ...mediaItemSelectColumns,
];

export const build__AlbumReadRepository = ({
  database,
}: ReadRepositoryDeps): AlbumReadRepository => ({
  listByViewerId: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumSortBy>;
  }): Promise<PagedList<AlbumWithCoverRow>> => {
    const rows = await withEnumRevival(
      database('album')
        .modify(withViewerMembership(database, viewerId))
        .modify(withAlbumCoverItem)
        .modify(withAlbumItemCount(database))
        .modify(withUnseenAlbumFlag(database, viewerId))
        .modify(withCollectionInfo(database, collectionInfo))
        .select<(AlbumWithCoverRow & { totalCount: number })[]>(...albumFields)
        .where('albumMember.userId', viewerId)
        .andWhere('album.isPublicLinkAlbum', false),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    );
    return toPagedResult(rows);
  },

  getAlbumForViewer: async ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }): Promise<AlbumWithCoverRow | undefined> => {
    return withEnumRevival(
      database<AlbumWithCoverRow>('album')
        .modify(withViewerMembership(database, viewerId))
        .modify(withAlbumCoverItem)
        .modify(withAlbumItemCount(database))
        .select(...albumFields)
        .where('album.id', albumId)
        .modify(withViewableByMemberOrAlbumGrant(database, viewerId))
        .first<AlbumWithCoverRow>(),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    );
  },
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
      database('albumItem')
        .innerJoin('album', 'albumItem.albumId', 'album.id')
        .modify(withViewerMembership(database, viewerId))
        .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
        .where('album.id', albumId)
        .andWhere('mediaItem.status', MediaItemStatus.ready)
        .modify(withAlbumItemViewableByMemberOrItemGrant(database, viewerId))
        .select(...albumItemWithMediaSelectColumns)
        .modify(withCollectionInfo(database, collectionInfo)),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
      { strict: true },
    )) as (AlbumItemWithMediaRow & { totalCount: number })[];
    return toPagedResult(rows);
  },
  findAlbumIdsReferencingMediaItem: async ({
    mediaItemId,
  }: {
    mediaItemId: string;
  }): Promise<AlbumIdRow[]> => {
    return database<AlbumIdRow>('album')
      .leftJoin('albumItem', 'albumItem.albumId', 'album.id')
      .where('albumItem.mediaItemId', mediaItemId)
      .orWhere('album.coverMediaId', mediaItemId)
      .distinct({ id: 'album.id' });
  },

  getAlbumForShareLink: async ({
    albumId,
    publicLinkId,
  }: {
    albumId: string;
    publicLinkId: string;
  }): Promise<AlbumWithCoverRow | undefined> => {
    return withEnumRevival(
      database<AlbumWithCoverRow>('album')
        .modify(withAlbumCoverItem)
        .modify(withAlbumItemCount(database))
        .where('album.id', albumId)
        .modify(withActiveShareLink(database, albumId, publicLinkId))
        .select<AlbumWithCoverRow>(...publicAlbumFields)
        .first(),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
      { strict: true },
    );
  },

  listAlbumItemsForShareLink: async ({
    albumId,
    publicLinkId,
    collectionInfo,
  }: {
    albumId: string;
    publicLinkId: string;
    collectionInfo: CollectionInfo<AlbumItemSortBy>;
  }): Promise<PagedList<AlbumItemWithMediaRow>> => {
    const query = database('albumItem')
      .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
      .where('albumItem.albumId', albumId)
      .where('mediaItem.status', MediaItemStatus.ready.value)
      .modify(withActiveShareLink(database, albumId, publicLinkId))
      .modify(withCollectionInfo(database, collectionInfo))
      .select<(AlbumItemWithMediaRow & { totalCount: number })[]>(
        ...albumItemWithMediaSelectColumns,
      );

    const rows = await withEnumRevival(
      query,
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
      { strict: true },
    );

    return toPagedResult(rows);
  },
});
