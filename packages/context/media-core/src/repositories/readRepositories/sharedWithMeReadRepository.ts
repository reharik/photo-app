import { AlbumMemberRole, MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { EntityId, PagedList, SharedWithMeMediaItemCollectionInfo, toPagedResult } from '../..';
import { SharedWithMeAlbumCollectionInfo } from '../../services/readServices/types';
import type {
  ReadRepositoryDeps,
  SharedAlbumRow,
  SharedWithMedMediaItemRow,
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
  'album.id as albumId',
  'album.title as albumTitle',
  'album.createdAt as albumCreatedAt',
  'album.updatedAt as albumUpdatedAt',
  'albumMember.role as viewerMemberRole',
  ...mediaItemSelectColumns,
];

const accessGrantFieldSelect = [
  'accessGrant.id as id',
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
  }): Promise<PagedList<SharedWithMedMediaItemRow>> => {
    const baseQuery = database('accessGrant')
      .innerJoin('mediaItem', 'mediaItem.id', 'accessGrant.mediaItemId')
      .whereNotNull('accessGrant.mediaItemId')
      .orderBy(`mediaItem.${collectionInfo.sortBy.column}`, collectionInfo.sortDir.value)
      .orderBy('mediaItem.id', 'asc')
      .select(...accessGrantFieldSelect, ...mediaItemSelectColumns)
      .select(database.raw('COUNT(*) OVER ()::int AS "totalCount"'))
      .limit(collectionInfo.pageInfo.limit + 1)
      .offset(collectionInfo.pageInfo.offset);

    const grantedQuery = applyActiveUserGrant(baseQuery, { database, viewerId });

    const rows = (await withEnumRevival(
      grantedQuery,
      { mediaItemKind: MediaKind, mediaItemStatus: MediaItemStatus },
      { strict: true },
    )) as (SharedWithMedMediaItemRow & { totalCount: number })[];

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
      .whereNotNull('accessGrant.albumId')
      .andWhere('album.isPublicLinkAlbum', false)
      .orderBy('accessGrant.createdAt', 'desc')
      .select<(SharedAlbumRow & { totalCount: number })[]>(
        ...accessGrantFieldSelect,
        ...albumWithCoverSelectColumns,
      )
      .select(database.raw('COALESCE(item_counts.item_count, 0)::int AS "itemCount"'))
      .select(database.raw('COUNT(*) OVER ()::int AS "totalCount"'))
      .limit(collectionInfo.pageInfo.limit + 1)
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
});
