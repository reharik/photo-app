import {
  AlbumItemSortBy,
  AlbumMemberRole,
  AlbumSortBy,
  MediaItemStatus,
  MediaKind,
} from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import {
  AlbumItemWithMediaRow,
  AlbumWithCoverRow,
  PagedList,
} from '../../services/readServices/types';
import { CollectionInfo } from '../../types/types';
import { toPagedResult } from '../repositoryHelpers';
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

const albumWithCoverSelectColumns = [
  'album.id as id',
  'album.title as title',
  'album.createdAt as createdAt',
  'album.updatedAt as updatedAt',
  'albumMember.role as viewerMemberRole',
  ...mediaItemSelectColumns,
];

const publicAlbumWithCoverSelectColumns = [
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

const whereActiveShareLinkGrant =
  (db: Knex, albumId: string, publicLinkId: string) =>
  (qb: Knex.QueryBuilder): void => {
    qb.whereExists(
      db
        .select(db.raw('1'))
        .from('accessGrant as ag')
        .where('ag.albumId', albumId)
        .where('ag.shareLinkId', publicLinkId)
        .whereNull('ag.revokedAt')
        .andWhere((expiry) => {
          expiry.whereNull('ag.expiresAt').orWhere('ag.expiresAt', '>', db.raw('now()'));
        }),
    );
  };

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
    const rows = (await withEnumRevival(
      database('album')
        .leftJoin('albumMember', (join) => {
          join
            .on('albumMember.albumId', 'album.id')
            .on('albumMember.userId', database.raw('?', [viewerId]));
        })
        .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
        .leftJoin(
          database('album_item')
            .select('album_id')
            .count('* as item_count')
            .groupBy('album_id')
            .as('item_counts'),
          'item_counts.album_id',
          'album.id',
        )
        .select(...albumWithCoverSelectColumns)
        .select(database.raw('COALESCE(item_counts.item_count, 0)::int AS "itemCount"'))
        .select(database.raw('COUNT(*) OVER ()::int AS "totalCount"'))
        .where('albumMember.userId', viewerId)
        .andWhere('album.isPublicLinkAlbum', false)
        .orderBy(`album.${collectionInfo.sortBy.column}`, collectionInfo.sortDir.value)
        .orderBy('album.id', 'asc')
        .limit(collectionInfo.pageInfo.limit)
        .offset(collectionInfo.pageInfo.offset),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    )) as (AlbumWithCoverRow & { totalCount: number })[];
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
        .leftJoin('albumMember', (join) => {
          join
            .on('albumMember.albumId', 'album.id')
            .on('albumMember.userId', database.raw('?', [viewerId]));
        })
        .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
        .select(
          database('album_item')
            .count('* as item_count')
            .where('album_item.album_id', albumId)
            .as('itemCount'),
        )
        .select(...albumWithCoverSelectColumns)
        .where('album.id', albumId)
        .andWhere((b) => {
          whereAlbumViewableByMemberOrAlbumGrant(database, viewerId)(b);
        })
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
        .leftJoin('albumMember', (join) => {
          join
            .on('albumMember.albumId', 'album.id')
            .on('albumMember.userId', database.raw('?', [viewerId]));
        })
        .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
        .where('album.id', albumId)
        .andWhere('mediaItem.status', MediaItemStatus.ready)
        .andWhere((b) => {
          b.where('albumMember.userId', viewerId).orWhereExists(function () {
            this.select('*')
              .from('grant')
              .whereRaw('?? = ??', ['grant.mediaItemId', 'albumItem.mediaItemId'])
              .whereRaw('?? = ?', ['grant.grantedToUser', viewerId]);
          });
        })
        .select(...albumItemWithMediaSelectColumns)
        .select(database.raw('COUNT(*) OVER ()::int AS "totalCount"'))
        .orderBy(`albumItem.${collectionInfo.sortBy.column}`, collectionInfo.sortDir.value)
        .orderBy('albumItem.id', 'asc')
        .limit(collectionInfo.pageInfo.limit + 1)
        .offset(collectionInfo.pageInfo.offset),
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
        .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
        .select(
          database('album_item')
            .count('* as item_count')
            .where('album_item.album_id', albumId)
            .as('itemCount'),
        )
        .where('album.id', albumId)
        .where((b) => {
          whereActiveShareLinkGrant(database, albumId, publicLinkId)(b);
        })
        .select<AlbumWithCoverRow>(...publicAlbumWithCoverSelectColumns)
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
    const rows = (await withEnumRevival(
      database('albumItem')
        .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
        .where('albumItem.albumId', albumId)
        .where('mediaItem.status', MediaItemStatus.ready.value)
        .where((b) => {
          whereActiveShareLinkGrant(database, albumId, publicLinkId)(b);
        })
        .select<(AlbumItemWithMediaRow & { totalCount: number })[]>(
          ...albumItemWithMediaSelectColumns,
        )
        .select(database.raw('COUNT(*) OVER ()::int AS "totalCount"'))
        .orderBy('albumItem.orderIndex', 'asc')
        .orderBy('albumItem.id', 'asc')
        .limit(collectionInfo.pageInfo.limit + 1)
        .offset(collectionInfo.pageInfo.offset),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
      { strict: true },
    )) as (AlbumItemWithMediaRow & { totalCount: number })[];

    return toPagedResult(rows);
  },
});
