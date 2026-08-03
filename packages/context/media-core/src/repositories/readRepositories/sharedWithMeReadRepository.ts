import { AlbumMemberRole, MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { EntityId, PagedList, toPagedResult } from '../..';
import { SharedWithMeAlbumCollectionInfo } from '../../services/readServices/types';
import {
  withActiveGrants,
  withAlbumCoverItem,
  withAlbumItemCount,
  withAttachViewerMembership,
  withCollectionInfo,
  withGrantedBy,
} from '../queryHelpers';
import type { ReadRepositoryDeps, SharedAlbumRow, SharedWithMeReadRepository } from './types';

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
  getAlbumsSharedWithMe: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: EntityId;
    collectionInfo: SharedWithMeAlbumCollectionInfo;
  }): Promise<PagedList<SharedAlbumRow>> => {
    const query = database('accessGrant')
      .innerJoin('album', 'album.id', 'accessGrant.albumId')
      .modify(withAttachViewerMembership(database, viewerId))
      .modify(withAlbumCoverItem)
      .modify(withAlbumItemCount(database))
      .modify(withGrantedBy('album'))
      .modify(withActiveGrants(database, viewerId))
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
      .modify(withAttachViewerMembership(database, viewerId))
      .modify(withAlbumCoverItem)
      .modify(withAlbumItemCount(database))
      .modify(withGrantedBy('album'))
      .modify(withActiveGrants(database, viewerId))
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
