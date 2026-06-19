import { AlbumMemberRole, MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { EntityId, PagedList, SharedWithMeMediaItemCollectionInfo, toPagedResult } from '../..';
import { SharedWithMeAlbumCollectionInfo } from '../../services/readServices/types';
import type {
  ReadRepositoryDeps,
  SharedAlbumRow,
  SharedWithMeMediaItemRow,
  SharedWithMeReadRepository,
} from './types';

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

const accessGrantFieldSelect = [
  'accessGrant.id as grantId',
  'accessGrant.createdAt as sharedAt',
  'accessGrant.grantedBy as sharedBy',
];

const applyActiveUserGrant = <TRecord extends object, TResult>(
  q: Knex.QueryBuilder<TRecord, TResult>,
  { database, viewerId }: { database: Knex; viewerId: string },
): Knex.QueryBuilder<TRecord, TResult> => {
  return q
    .where('accessGrant.grantedToUser', viewerId)
    .whereNull('accessGrant.revokedAt')
    .where((b) => {
      b.whereNull('accessGrant.expiresAt').orWhere(
        'accessGrant.expiresAt',
        '>',
        database.raw('now()'),
      );
    });
};

export const build__SharedWithMeReadRepository = ({
  database,
}: ReadRepositoryDeps): SharedWithMeReadRepository => ({
  getMediaItemsSharedWithMe: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: EntityId;
    collectionInfo: SharedWithMeMediaItemCollectionInfo;
  }): Promise<PagedList<SharedWithMeMediaItemRow>> => {
    const baseQuery = database('accessGrant')
      .innerJoin('mediaItem', 'mediaItem.id', 'accessGrant.mediaItemId')
      .whereNotNull('accessGrant.mediaItemId')
      .leftJoin('user as granter', 'granter.id', 'accessGrant.grantedBy')
      .orderBy(`accessGrant.${collectionInfo.sortBy.column}`, collectionInfo.sortDir.value)
      .orderBy('mediaItem.id', 'asc')
      .select(
        ...accessGrantFieldSelect,
        ...mediaItemSelectColumns,
        'granter.grantedByFirstName',
        'granter.grantedByLastName',
      )
      .select(database.raw('COUNT(*) OVER ()::int AS "totalCount"'))
      .limit(collectionInfo.pageInfo.limit + 1)
      .offset(collectionInfo.pageInfo.offset);

    const grantedQuery = applyActiveUserGrant(baseQuery, { database, viewerId });

    const rows = (await withEnumRevival(
      grantedQuery,
      { mediaItemKind: MediaKind, mediaItemStatus: MediaItemStatus },
      { strict: true },
    )) as (SharedWithMeMediaItemRow & { totalCount: number })[];

    return toPagedResult(rows);
  },
  getAlbumsSharedWithMe: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: EntityId;
    collectionInfo: SharedWithMeAlbumCollectionInfo;
  }): Promise<PagedList<SharedAlbumRow>> => {
    const baseQuery = database<SharedAlbumRow>('accessGrant')
      .innerJoin('album', 'album.id', 'accessGrant.albumId')
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
      .leftJoin('user as granter', 'granter.id', 'accessGrant.grantedBy')
      .whereNotNull('accessGrant.albumId')
      .andWhere('album.isPublicLinkAlbum', false)
      .orderBy(`accessGrant.${collectionInfo.sortBy.column}`, collectionInfo.sortDir.value)
      .orderBy('album.id', 'asc')
      .select<(SharedAlbumRow & { totalCount: number })[]>(
        ...accessGrantFieldSelect,
        ...albumWithCoverSelectColumns,
        'granter.grantedByFirstName',
        'granter.grantedByLastName',
      )
      .select(database.raw('COALESCE(item_counts.item_count, 0)::int AS "itemCount"'))
      .select(database.raw('COUNT(*) OVER ()::int AS "totalCount"'))
      .limit(collectionInfo.pageInfo.limit)
      .offset(collectionInfo.pageInfo.offset);

    const grantedQuery = applyActiveUserGrant(baseQuery, { database, viewerId });

    const rows = (await withEnumRevival(
      grantedQuery,
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    )) as (SharedAlbumRow & { totalCount: number })[];

    return toPagedResult(rows);
  },
  getAlbumSharedWithMe: async ({
    viewerId,
    albumId,
  }: {
    viewerId: EntityId;
    albumId: string;
  }): Promise<SharedAlbumRow | undefined> => {
    const baseQuery = database<SharedAlbumRow>('accessGrant')
      .innerJoin('album', 'album.id', 'accessGrant.albumId')
      .leftJoin('albumMember', (join) => {
        join
          .on('albumMember.albumId', 'album.id')
          .on('albumMember.userId', database.raw('?', [viewerId]));
      })
      .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
      .leftJoin('user as granter', 'granter.id', 'accessGrant.grantedBy')
      .whereNotNull('accessGrant.albumId')
      .andWhere('album.isPublicLinkAlbum', false)
      .select(
        database('album_item')
          .count('* as item_count')
          .where('album_item.album_id', albumId)
          .as('itemCount'),
      )
      .select<SharedAlbumRow>(
        ...accessGrantFieldSelect,
        ...albumWithCoverSelectColumns,
        'granter.grantedByFirstName',
        'granter.grantedByLastName',
      )
      .where('album.id', albumId);
    const grantedQuery = applyActiveUserGrant(baseQuery, { database, viewerId });

    const row = (await withEnumRevival(
      grantedQuery,
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    )) as SharedAlbumRow | undefined;

    return row;
  },
});
