import { AlbumItemSortBy, AlbumSortBy } from '@packages/contracts';
import type { Knex } from 'knex';
import {
  AlbumItemWithMediaRow,
  AlbumWithCoverRow,
} from '../../services/readServices/viewerReadServices/viewerAlbumReadService.types';
import { CollectionInfo } from '../../types/types';

export type AlbumReadRepository = {
  listByViewerId: ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumSortBy>;
  }) => Promise<AlbumWithCoverRow[]>;
  getAlbumForViewer: ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }) => Promise<AlbumWithCoverRow | undefined>;
  getViewableAlbumItemsForViewer: ({
    albumId,
    viewerId,
    collectionInfo,
  }: {
    albumId: string;
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumItemSortBy>;
  }) => Promise<AlbumItemWithMediaRow[]>;
  findAlbumIdsReferencingMediaItem: ({ mediaItemId }: { mediaItemId: string }) => Promise<string[]>;
};

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
];

const albumWithCoverSelectColumns = [
  'album.id as id',
  'album.title as title',
  'album.createdAt as createdAt',
  'album.updatedAt as updatedAt',
  ...mediaItemSelectColumns,
];

const albumItemWithMediaSelectColumns = [
  'albumItem.id',
  'albumItem.orderIndex as albumItemOrderIndex',
  'albumItem.createdAt',
  'albumItem.updatedAt',
  ...mediaItemSelectColumns,
];

type AlbumReadRepositoryDeps = { database: Knex };

export const buildAlbumReadRepository = ({
  database,
}: AlbumReadRepositoryDeps): AlbumReadRepository => ({
  listByViewerId: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumSortBy>;
  }): Promise<AlbumWithCoverRow[]> => {
    return database<AlbumWithCoverRow>('album')
      .innerJoin('albumMember', 'albumMember.albumId', 'album.id')
      .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
      .where('albumMember.userId', viewerId)
      .select<AlbumWithCoverRow[]>(...albumWithCoverSelectColumns)
      .orderBy(`album.${collectionInfo.sortBy.column}`, collectionInfo.sortDir.value)
      .orderBy('album.id', 'asc') // tie-breaker (unqualified `id` / `created_at` are ambiguous with joined mediaItem)
      .limit(collectionInfo.pageInfo.limit + 1)
      .offset(collectionInfo.pageInfo.offset);
  },

  getAlbumForViewer: async ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }): Promise<AlbumWithCoverRow | undefined> => {
    const row = await database<AlbumWithCoverRow>('album')
      .innerJoin('albumMember', 'albumMember.albumId', 'album.id')
      .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
      .where('albumMember.userId', viewerId)
      .andWhere('album.id', albumId)
      .first<AlbumWithCoverRow>(...albumWithCoverSelectColumns);

    return row;
  },
  getViewableAlbumItemsForViewer: async ({
    albumId,
    viewerId,
    collectionInfo,
  }: {
    albumId: string;
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumItemSortBy>;
  }): Promise<AlbumItemWithMediaRow[]> => {
    return database<AlbumItemWithMediaRow>('albumItem')
      .innerJoin('album', 'albumItem.albumId', 'album.id')
      .innerJoin('albumMember', 'albumMember.albumId', 'album.id')
      .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
      .where('albumMember.userId', viewerId)
      .andWhere('album.id', albumId)
      .andWhere('mediaItem.status', 'READY')
      .select<AlbumItemWithMediaRow[]>(...albumItemWithMediaSelectColumns)
      .orderBy(`albumItem.${collectionInfo.sortBy.column}`, collectionInfo.sortDir.value)
      .orderBy('albumItem.id', 'asc') // tie-breaker
      .limit(collectionInfo.pageInfo.limit + 1)
      .offset(collectionInfo.pageInfo.offset);
  },
  findAlbumIdsReferencingMediaItem: async ({
    mediaItemId,
  }: {
    mediaItemId: string;
  }): Promise<string[]> => {
    return database<{ id: string }>('album')
      .leftJoin('albumItem', 'albumItem.albumId', 'album.id')
      .where('albumItem.mediaItemId', mediaItemId)
      .orWhere('album.coverMediaId', mediaItemId)
      .distinct({ id: 'album.id' });
  },
});
