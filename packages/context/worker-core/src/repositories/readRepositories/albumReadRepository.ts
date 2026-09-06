import { AlbumMemberRole, AlbumSortBy, MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { AlbumWithCoverRow, PagedList } from '../../services/readServices/types';
import { CollectionInfo } from '../../types/types';
import {
  toPagedResult,
  withAlbumCoverItem,
  withAlbumItemCount,
  withAttachViewerMembership,
  withCollectionInfo,
  withViewableByMemberOrAlbumGrant,
} from '../queryHelpers';
import { withActivePublicLink } from '../queryHelpers/withActivePublicLink';
import { withAlbumOwnerName } from '../queryHelpers/withAlbumOwnerName';
import type { AlbumIdRow, AlbumReadRepository, ReadRepositoryDeps } from './types';

const publicAlbumFields = [
  'album.id as id',
  'album.title as title',
  'album.createdAt as createdAt',
  'album.updatedAt as updatedAt',
];

const albumFields = [...publicAlbumFields, 'albumMember.role as viewerMemberRole'];

export const build__AlbumReadRepository = ({ uow }: ReadRepositoryDeps): AlbumReadRepository => ({
  listByViewerId: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumSortBy>;
  }): Promise<PagedList<AlbumWithCoverRow>> => {
    await uow.join();
    const rows = await withEnumRevival(
      uow
        .db()('album')
        .modify(withAttachViewerMembership(uow.db(), viewerId))
        .modify(withAlbumCoverItem)
        .modify(withAlbumItemCount(uow.db()))
        .modify(withCollectionInfo(uow.db(), collectionInfo))
        .select<(AlbumWithCoverRow & { totalCount: number })[]>(...albumFields)
        .where('albumMember.userId', viewerId)
        .andWhere('album.isShadowAlbum', false),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
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
    await uow.join();
    return withEnumRevival(
      uow
        .db()<AlbumWithCoverRow>('album')
        .modify(withAttachViewerMembership(uow.db(), viewerId))
        .modify(withAlbumCoverItem)
        .modify(withAlbumItemCount(uow.db()))
        .modify(withAlbumOwnerName(uow.db()))
        .select(...albumFields)
        .where('album.id', albumId)
        .modify(withViewableByMemberOrAlbumGrant(uow.db(), viewerId))
        .first<AlbumWithCoverRow>(),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
    );
  },

  findAlbumIdsReferencingMediaItem: async ({
    mediaItemId,
  }: {
    mediaItemId: string;
  }): Promise<AlbumIdRow[]> => {
    await uow.join();
    return uow
      .db()<AlbumIdRow>('album')
      .leftJoin('albumItem', 'albumItem.albumId', 'album.id')
      .where('albumItem.mediaItemId', mediaItemId)
      .orWhere('album.coverMediaId', mediaItemId)
      .distinct({ id: 'album.id' });
  },

  getAlbumForPublicLink: async ({
    albumId,
    publicLinkId,
  }: {
    albumId: string;
    publicLinkId: string;
  }): Promise<AlbumWithCoverRow | undefined> => {
    await uow.join();
    return withEnumRevival(
      uow
        .db()<AlbumWithCoverRow>('album')
        .modify(withAlbumCoverItem)
        .modify(withAlbumItemCount(uow.db()))
        .modify(withAlbumOwnerName(uow.db()))
        .where('album.id', albumId)
        .modify(withActivePublicLink(uow.db(), albumId, publicLinkId))
        .select<AlbumWithCoverRow>(...publicAlbumFields)
        .first(),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
    );
  },
});
