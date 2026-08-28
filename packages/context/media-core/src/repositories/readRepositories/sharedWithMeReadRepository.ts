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
  uow,
}: ReadRepositoryDeps): SharedWithMeReadRepository => ({
  getAlbumsSharedWithMe: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: EntityId;
    collectionInfo: SharedWithMeAlbumCollectionInfo;
  }): Promise<PagedList<SharedAlbumRow>> => {
    await uow.join();
    const query = uow
      .db()('accessGrant')
      .innerJoin('album', 'album.id', 'accessGrant.albumId')
      .modify(withAttachViewerMembership(uow.db(), viewerId))
      .modify(withAlbumCoverItem)
      .modify(withAlbumItemCount(uow.db()))
      .modify(withGrantedBy('album'))
      .modify(withActiveGrants(uow.db(), viewerId))
      .modify(withCollectionInfo(uow.db(), collectionInfo))
      .select<(SharedAlbumRow & { totalCount: number })[]>(...albumFields);

    const rows = await withEnumRevival(query, {
      mediaItemKind: MediaKind,
      mediaItemStatus: MediaItemStatus,
      viewerMemberRole: AlbumMemberRole,
    });
    return toPagedResult(rows);
  },
  getAlbumSharedWithMe: async ({
    viewerId,
    albumId,
  }: {
    viewerId: EntityId;
    albumId: string;
  }): Promise<SharedAlbumRow | undefined> => {
    await uow.join();
    const query = uow
      .db()('accessGrant')
      .innerJoin('album', 'album.id', 'accessGrant.albumId')
      .modify(withAttachViewerMembership(uow.db(), viewerId))
      .modify(withAlbumCoverItem)
      .modify(withAlbumItemCount(uow.db()))
      .modify(withGrantedBy('album'))
      .modify(withActiveGrants(uow.db(), viewerId))
      .select<SharedAlbumRow>(...albumFields)
      .where('album.id', albumId);

    const row = await withEnumRevival(query, {
      mediaItemKind: MediaKind,
      mediaItemStatus: MediaItemStatus,
      viewerMemberRole: AlbumMemberRole,
    });

    return row;
  },
});
