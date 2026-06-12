import { AlbumMemberRole } from '@packages/contracts';
import {
  SharedAlbumRow,
  SharedWithMeReadRepository,
} from '../../../repositories/readRepositories/types';
import { ReadServiceBase } from '../readServiceBaseType';
import { mapMediaItemRowToDBMediaItemRow } from '../readServiceMappers';
import {
  AlbumProjection,
  AlbumWithCoverRow,
  MediaItemProjection,
  PagedList,
  SharedWithMeAlbumCollectionInfo,
  SharedWithMeAlbumProjection,
} from '../types';

export interface ViewerSharedWithMeAlbumReadService extends ReadServiceBase {
  listAlbums: (
    collectionInfo: SharedWithMeAlbumCollectionInfo,
  ) => Promise<PagedList<SharedWithMeAlbumProjection>>;
  getAlbum: (albumId: string) => Promise<SharedWithMeAlbumProjection | undefined>;
}

type ViewerSharedWithMeAlbumReadServiceDeps = {
  sharedWithMeReadRepository: SharedWithMeReadRepository;
  viewerId: string;
};

export const build__ViewerSharedWithMeAlbumReadService = ({
  sharedWithMeReadRepository,
  viewerId,
}: ViewerSharedWithMeAlbumReadServiceDeps): ViewerSharedWithMeAlbumReadService => {
  const buildCover = (album: AlbumWithCoverRow) => {
    if (album.mediaItemId == null) {
      return undefined;
    }
    const cover = mapMediaItemRowToDBMediaItemRow(album);
    return {
      ...cover,
      tags: [],
      viewerReactions: [],
      reactionCounts: { total: 0, byEmoji: [] },
      // This is a mediaItem, however, it is special because it is
      // actually a feature of the album that can be added and removed but nothing else.
      operations: album.viewerMemberRole?.equals(AlbumMemberRole.owner)
        ? album.viewerMemberRole.operations
        : [],
    };
  };

  const buildAlbumProjection = (
    album: AlbumWithCoverRow,
    coverMedia: MediaItemProjection | undefined,
  ): AlbumProjection => ({
    id: album.id,
    title: album.title,
    itemCount: album.itemCount,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
    viewerMemberRole: album.viewerMemberRole,
    coverMedia,
    operations: album.viewerMemberRole?.operations ?? [],
  });

  const buildSharedAlbumProjection = (row: SharedAlbumRow): SharedWithMeAlbumProjection => {
    const coverMedia = buildCover(row);
    return {
      id: row.grantId,
      sharedAt: row.sharedAt,
      sharedBy: row.sharedBy,
      album: buildAlbumProjection(row, coverMedia),
    };
  };

  return {
    listAlbums: async (
      collectionInfo: SharedWithMeAlbumCollectionInfo,
    ): Promise<PagedList<SharedWithMeAlbumProjection>> => {
      const albumsResult = await sharedWithMeReadRepository.getAlbumsSharedWithMe({
        viewerId,
        collectionInfo,
      });

      return {
        nodes: albumsResult.nodes.map(buildSharedAlbumProjection),
        totalCount: albumsResult.totalCount,
      };
    },

    getAlbum: async (albumId: string): Promise<SharedWithMeAlbumProjection | undefined> => {
      const row = await sharedWithMeReadRepository.getAlbumSharedWithMe({ albumId, viewerId });
      if (!row) {
        return undefined;
      }
      return buildSharedAlbumProjection(row);
    },
  };
};
