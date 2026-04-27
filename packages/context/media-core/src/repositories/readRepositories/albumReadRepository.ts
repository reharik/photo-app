import { AlbumItemSortBy, AlbumMemberRole, AlbumSortBy } from '@packages/contracts';
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
  }) => Promise<(AlbumWithCoverRow & { viewerIsOwner: boolean })[]>;
  getAlbumForViewer: ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }) => Promise<(AlbumWithCoverRow & { viewerIsOwner: boolean }) | undefined>;
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

const viewerIsOwnerSelect = (db: Knex) =>
  db.raw(
    'CASE WHEN ?? IS NOT NULL AND ?? = ? THEN true WHEN ?? IS NOT NULL THEN false ELSE false END as "viewerIsOwner"',
    ['albumMember.id', 'albumMember.role', AlbumMemberRole.owner.value, 'albumMember.id'],
  );

const whereAlbumViewableByMemberOrAlbumGrant =
  (db: Knex, viewerId: string) =>
  (w: {
    where: (col: string, val: string) => void;
    orWhereExists: (sub: Knex.QueryBuilder) => void;
  }): void => {
    w.where('albumMember.userId', viewerId);
    w.orWhereExists(
      db
        .select(db.raw('1'))
        .from('accessGrant as ag2')
        .whereNull('ag2.revokedAt')
        .where((inner) => {
          inner.whereNull('ag2.expiresAt').orWhere('ag2.expiresAt', '>', db.raw('now()'));
        })
        .where('ag2.grantedToUser', viewerId)
        .whereNotNull('ag2.albumId')
        .whereNull('ag2.mediaItemId')
        .where('ag2.albumId', db.ref('album.id')),
    );
  };

export const buildAlbumReadRepository = ({
  database,
}: AlbumReadRepositoryDeps): AlbumReadRepository => ({
  listByViewerId: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumSortBy>;
  }): Promise<(AlbumWithCoverRow & { viewerIsOwner: boolean })[]> => {
    return database<AlbumWithCoverRow & { viewerIsOwner: boolean }>('album')
      .leftJoin('albumMember', (join) => {
        join
          .on('albumMember.albumId', 'album.id')
          .on('albumMember.userId', database.raw('?', [viewerId]));
      })
      .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
      .select(...albumWithCoverSelectColumns, viewerIsOwnerSelect(database))
      .where((b) => {
        whereAlbumViewableByMemberOrAlbumGrant(database, viewerId)(b);
      })
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
  }): Promise<(AlbumWithCoverRow & { viewerIsOwner: boolean }) | undefined> => {
    return database<AlbumWithCoverRow & { viewerIsOwner: boolean }>('album')
      .leftJoin('albumMember', (join) => {
        join
          .on('albumMember.albumId', 'album.id')
          .on('albumMember.userId', database.raw('?', [viewerId]));
      })
      .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
      .select(...albumWithCoverSelectColumns, viewerIsOwnerSelect(database))
      .where('album.id', albumId)
      .andWhere((b) => {
        whereAlbumViewableByMemberOrAlbumGrant(database, viewerId)(b);
      })
      .first();
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
      .leftJoin('albumMember', (join) => {
        join
          .on('albumMember.albumId', 'album.id')
          .on('albumMember.userId', database.raw('?', [viewerId]));
      })
      .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
      .leftJoin('grant', (join) => {
        join
          .on('grant.mediaItemId', 'albumItem.mediaItemId')
          .on('grant.grantedToUser', database.raw('?', [viewerId]));
      })
      .where('album.id', albumId)
      .andWhere('mediaItem.status', 'READY')
      .andWhere((b) => {
        b.where('albumMember.userId', viewerId).orWhereNotNull('grant.id');
      })
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
