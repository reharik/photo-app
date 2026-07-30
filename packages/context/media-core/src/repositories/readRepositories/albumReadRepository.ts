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
    const rows = await withEnumRevival(
      database('album')
        .modify(withAttachViewerMembership(database, viewerId))
        .modify(withAlbumCoverItem)
        .modify(withAlbumItemCount(database))
        .modify(withCollectionInfo(database, collectionInfo))
        .select<(AlbumWithCoverRow & { totalCount: number })[]>(...albumFields)
        .where('albumMember.userId', viewerId)
        .andWhere('album.isPublicLinkAlbum', false),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
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
    return withEnumRevival(
      database<AlbumWithCoverRow>('album')
        .modify(withAttachViewerMembership(database, viewerId))
        .modify(withAlbumCoverItem)
        .modify(withAlbumItemCount(database))
        .modify(withAlbumOwnerName(database))
        .select(...albumFields)
        .where('album.id', albumId)
        .modify(withViewableByMemberOrAlbumGrant(database, viewerId))
        .first<AlbumWithCoverRow>(),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    );
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

  getAlbumForPublicLink: async ({
    albumId,
    publicLinkId,
  }: {
    albumId: string;
    publicLinkId: string;
  }): Promise<AlbumWithCoverRow | undefined> => {
    return withEnumRevival(
      database<AlbumWithCoverRow>('album')
        .modify(withAlbumCoverItem)
        .modify(withAlbumItemCount(database))
        .modify(withAlbumOwnerName(database))
        .where('album.id', albumId)
        .modify(withActivePublicLink(database, albumId, publicLinkId))
        .select<AlbumWithCoverRow>(...publicAlbumFields)
        .first(),
      {
        mediaItemKind: MediaKind,
        mediaItemStatus: MediaItemStatus,
      },
      { strict: true },
    );
  },
});
