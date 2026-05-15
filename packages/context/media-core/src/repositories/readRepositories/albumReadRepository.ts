import {
  AlbumItemSortBy,
  AlbumMemberRole,
  AlbumSortBy,
  MediaItemStatus,
  MediaKind,
} from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { AlbumItemWithMediaRow, AlbumWithCoverRow } from '../../services/readServices/types';
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
  findAlbumIdsReferencingMediaItem: ({
    mediaItemId,
  }: {
    mediaItemId: string;
  }) => Promise<{ id: string }[]>;
  getAlbumForShareLink: ({
    albumId,
    publicLinkId,
  }: {
    albumId: string;
    publicLinkId: string;
  }) => Promise<AlbumWithCoverRow | undefined>;
  /** Album items for public share-link viewing (no membership check). READY media only. */
  listAlbumItemsForShareLink: ({
    albumId,
    publicLinkId,
    collectionInfo,
  }: {
    albumId: string;
    publicLinkId: string;
    collectionInfo: CollectionInfo<AlbumItemSortBy>;
  }) => Promise<AlbumItemWithMediaRow[]>;
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
  'mediaItem.reactionCounts as mediaItemReactionCounts',
  'mediaItem.viewerReactions as mediaItemViewerReactions',
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

type AlbumReadRepositoryDeps = { database: Knex };

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
}: AlbumReadRepositoryDeps): AlbumReadRepository => ({
  listByViewerId: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumSortBy>;
  }): Promise<AlbumWithCoverRow[]> => {
    return withEnumRevival(
      database<AlbumWithCoverRow>('album')
        .leftJoin('albumMember', (join) => {
          join
            .on('albumMember.albumId', 'album.id')
            .on('albumMember.userId', database.raw('?', [viewerId]));
        })
        .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
        .select(...albumWithCoverSelectColumns)
        .where((b) => {
          whereAlbumViewableByMemberOrAlbumGrant(database, viewerId)(b);
        })
        .andWhere('album.isPublicLinkAlbum', false)
        .orderBy(`album.${collectionInfo.sortBy.column}`, collectionInfo.sortDir.value)
        .orderBy('album.id', 'asc') // tie-breaker (unqualified `id` / `created_at` are ambiguous with joined mediaItem)
        .limit(collectionInfo.pageInfo.limit + 1)
        .offset(collectionInfo.pageInfo.offset),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    );
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
  }): Promise<AlbumItemWithMediaRow[]> => {
    return withEnumRevival(
      database<AlbumItemWithMediaRow>('albumItem')
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
        .offset(collectionInfo.pageInfo.offset),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
      { strict: true },
    );
  },
  findAlbumIdsReferencingMediaItem: async ({
    mediaItemId,
  }: {
    mediaItemId: string;
  }): Promise<{ id: string }[]> => {
    return database<{ id: string }>('album')
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
  }): Promise<AlbumItemWithMediaRow[]> => {
    return withEnumRevival(
      database<AlbumItemWithMediaRow>('albumItem')
        .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
        .where('albumItem.albumId', albumId)
        .where('mediaItem.status', MediaItemStatus.ready.value)
        .where((b) => {
          whereActiveShareLinkGrant(database, albumId, publicLinkId)(b);
        })
        .select<AlbumItemWithMediaRow[]>(...albumItemWithMediaSelectColumns)
        .orderBy('albumItem.orderIndex', 'asc')
        .orderBy('albumItem.id', 'asc')
        .limit(collectionInfo.pageInfo.limit + 1)
        .offset(collectionInfo.pageInfo.offset),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
      { strict: true },
    );
  },
});
