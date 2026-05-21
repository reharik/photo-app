import { indexByUnique } from '@packages/infrastructure';
import { AlbumReadRepository } from '../../../repositories/readRepositories/types';
import { PublicReadServiceFactoryBase } from '../readServiceBaseType';
import { mapMediaItemRowToDBMediaItemRow } from '../readServiceMappers';
import {
  AlbumWithCoverRow,
  PagedList,
  PublicAlbumItemCollectionInfo,
  PublicAlbumItemProjection,
  PublicAlbumProjection,
} from '../types';
import { EnrichMediaItems } from '../viewerReadServices/enrichMediaItems';

export interface PublicAlbumReadService {
  getAlbum: (albumId: string) => Promise<PublicAlbumProjection | undefined>;
  getViewableAlbumItems: (args: {
    albumId: string;
    collectionInfo: PublicAlbumItemCollectionInfo;
  }) => Promise<PagedList<PublicAlbumItemProjection>>;
}

export interface PublicAlbumReadServiceFactory extends PublicReadServiceFactoryBase {
  (args: { publicLinkId: string }): PublicAlbumReadService;
}

type PublicAlbumReadServiceFactoryDeps = {
  albumReadRepository: AlbumReadRepository;
  enrichMediaItems: EnrichMediaItems;
};

export const build__PublicAlbumReadServiceFactory = ({
  albumReadRepository,
  enrichMediaItems,
}: PublicAlbumReadServiceFactoryDeps): PublicAlbumReadServiceFactory => {
  return ({ publicLinkId }: { publicLinkId: string }) => {
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
        operations: [],
      };
    };

    return {
      getAlbum: async (albumId: string): Promise<PublicAlbumProjection | undefined> => {
        const row = await albumReadRepository.getAlbumForShareLink({ albumId, publicLinkId });
        if (!row) {
          return undefined;
        }
        const coverMedia = buildCover(row);

        return {
          id: row.id,
          title: row.title,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          itemCount: row.itemCount,
          viewerMemberRole: row.viewerMemberRole,
          coverMedia,
          operations: [],
        };
      },

      getViewableAlbumItems: async ({
        albumId,
        collectionInfo,
      }: {
        albumId: string;
        collectionInfo: PublicAlbumItemCollectionInfo;
      }): Promise<PagedList<PublicAlbumItemProjection>> => {
        const albumItemsResult = await albumReadRepository.listAlbumItemsForShareLink({
          albumId,
          publicLinkId,
          collectionInfo,
        });
        const dbMediaItems = albumItemsResult.nodes.map((albumItem) =>
          mapMediaItemRowToDBMediaItemRow(albumItem),
        );
        const enrichedMediaItems = indexByUnique(
          await enrichMediaItems.enrichPublic(publicLinkId, dbMediaItems),
        );

        const nodes = albumItemsResult.nodes.map(
          (albumItem) =>
            ({
              id: albumItem.id,
              orderIndex: albumItem.albumItemOrderIndex,
              createdAt: albumItem.createdAt,
              updatedAt: albumItem.updatedAt,
              mediaItem: enrichedMediaItems.get(albumItem.mediaItemId),
              operations: [],
            }) as PublicAlbumItemProjection,
        );
        return {
          nodes,
          totalCount: albumItemsResult.totalCount,
        };
      },
    };
  };
};
