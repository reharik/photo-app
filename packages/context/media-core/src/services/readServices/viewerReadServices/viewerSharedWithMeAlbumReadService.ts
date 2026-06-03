import { AlbumMemberRole } from '@packages/contracts';
import {
  SharedAlbumRow,
  SharedWithMeReadRepository,
} from '../../../repositories/readRepositories/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { mapMediaItemRowToDBMediaItemRow } from '../readServiceMappers';
import {
  AlbumItemCollectionInfo,
  AlbumItemProjection,
  AlbumProjection,
  MediaItemProjection,
  PagedList,
  SharedWithMeAlbumCollectionInfo,
} from '../types';
import { ViewerAlbumReadService } from './viewerAlbumReadService';

export interface ViewerSharedWithMeAlbumReadService {
  listAlbums: (
    collectionInfo: SharedWithMeAlbumCollectionInfo,
  ) => Promise<PagedList<AlbumProjection>>;
  getAlbum: (albumId: string) => Promise<AlbumProjection | undefined>;
  getViewableAlbumItems: (args: {
    albumId: string;
    collectionInfo: AlbumItemCollectionInfo;
  }) => Promise<PagedList<AlbumItemProjection>>;
}

export interface ViewerSharedWithMeAlbumReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): ViewerSharedWithMeAlbumReadService;
}

type ViewerSharedWithMeAlbumReadServiceFactoryDeps = {
  sharedWithMeReadRepository: SharedWithMeReadRepository;
  viewerAlbumReadService: ViewerAlbumReadService;
};

export const build__ViewerSharedWithMeAlbumReadServiceFactory = ({
  sharedWithMeReadRepository,
  viewerAlbumReadService,
}: ViewerSharedWithMeAlbumReadServiceFactoryDeps): ViewerSharedWithMeAlbumReadServiceFactory => {
  return ({ viewerId }: { viewerId: string }) => {
    const buildCover = (album: SharedAlbumRow) => {
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

    return {
      listAlbums: async (
        collectionInfo: SharedWithMeAlbumCollectionInfo,
      ): Promise<PagedList<AlbumProjection>> => {
        const albumsResult = await sharedWithMeReadRepository.getAlbumsSharedWithMe({
          viewerId,
          collectionInfo,
        });
        const coversMap = new Map<string, MediaItemProjection>();
        for (const album of albumsResult.nodes.filter((a) => a.mediaItemId != null)) {
          const cover = buildCover(album);
          if (cover) {
            coversMap.set(album.id, cover);
          }
        }
        const nodes = albumsResult.nodes.map((album) => ({
          id: album.albumId,
          title: album.albumTitle,
          itemCount: album.albumItemCount,
          createdAt: album.albumCreatedAt,
          updatedAt: album.albumUpdatedAt,
          viewerMemberRole: album.viewerMemberRole,
          coverMedia: coversMap.get(album.id),
          operations: album.viewerMemberRole?.operations ?? [],
        }));

        return {
          nodes,
          totalCount: albumsResult.totalCount,
        };
      },

      getAlbum: viewerAlbumReadService.getAlbum,
      getViewableAlbumItems: viewerAlbumReadService.getViewableAlbumItems,
    };
  };
};
