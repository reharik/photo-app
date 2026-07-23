import { AlbumMemberRole, MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { EntityId, PagedList, SharedWithMeMediaItemCollectionInfo, toPagedResult } from '../..';
import { SharedWithMeAlbumCollectionInfo } from '../../services/readServices/types';
import {
  mediaItemSelectColumns,
  withActiveGrants,
  withAlbumCoverItem,
  withAlbumItemCount,
  withCollectionInfo,
  withGrantedBy,
  withViewerMembership,
} from '../queryHelpers';
import type {
  ReadRepositoryDeps,
  SharedAlbumRow,
  SharedWithMeMediaItemRow,
  SharedWithMeReadRepository,
} from './types';

const albumFields = [
  'album.id as id',
  'album.title as title',
  'album.createdAt as createdAt',
  'album.updatedAt as updatedAt',
  'albumMember.role as viewerMemberRole',
];

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
    const query = database('accessGrant')
      .innerJoin('mediaItem', 'mediaItem.id', 'accessGrant.mediaItemId')
      .modify(withGrantedBy('mediaItem'))
      .modify(withActiveGrants(database, viewerId))
      .modify(withCollectionInfo(database, collectionInfo))
      .select<(SharedWithMeMediaItemRow & { totalCount: number })[]>(...mediaItemSelectColumns);

    const rows = await withEnumRevival(
      query,
      { mediaItemKind: MediaKind, mediaItemStatus: MediaItemStatus },
      { strict: true },
    );

    return toPagedResult(rows);
  },
  getAlbumsSharedWithMe: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: EntityId;
    collectionInfo: SharedWithMeAlbumCollectionInfo;
  }): Promise<PagedList<SharedAlbumRow>> => {
    const query = database('accessGrant')
      .innerJoin('album', 'album.id', 'accessGrant.albumId')
      .modify(withViewerMembership(database, viewerId))
      .modify(withAlbumCoverItem)
      .modify(withAlbumItemCount(database))
      .modify(withGrantedBy('album'))
      .modify(withActiveGrants(database, viewerId))
      .andWhere('album.isPublicLinkAlbum', false)
      .modify(withCollectionInfo(database, collectionInfo))
      .select<(SharedAlbumRow & { totalCount: number })[]>(...albumFields);

    const rows = await withEnumRevival(
      query,
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    );
    return toPagedResult(rows);
  },
  getAlbumSharedWithMe: async ({
    viewerId,
    albumId,
  }: {
    viewerId: EntityId;
    albumId: string;
  }): Promise<SharedAlbumRow | undefined> => {
    const query = database('accessGrant')
      .innerJoin('album', 'album.id', 'accessGrant.albumId')
      .modify(withViewerMembership(database, viewerId))
      .modify(withAlbumCoverItem)
      .modify(withAlbumItemCount(database))
      .modify(withGrantedBy('album'))
      .modify(withActiveGrants(database, viewerId))
      .andWhere('album.isPublicLinkAlbum', false)
      .select<SharedAlbumRow>(...albumFields)
      .where('album.id', albumId);

    const row = await withEnumRevival(
      query,
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    );

    return row;
  },
});
