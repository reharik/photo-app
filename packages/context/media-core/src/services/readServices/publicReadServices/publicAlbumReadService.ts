import { AlbumReadRepository } from '../../../repositories/readRepositories/albumReadRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import { PublicReadServiceFactoryBase } from '../readServiceBaseType';
import { mapMediaItemRowToProjection } from '../readServiceMappers';
import {
  MediaItemProjection,
  PublicAlbumItemCollectionInfo,
  PublicAlbumItemListProjection,
  PublicAlbumProjection,
} from '../types';

export interface PublicAlbumReadService {
  getAlbum: (albumId: string) => Promise<PublicAlbumProjection | undefined>;
  getViewableAlbumItems: (args: {
    albumId: string;
    collectionInfo: PublicAlbumItemCollectionInfo;
  }) => Promise<PublicAlbumItemListProjection>;
}

export interface PublicAlbumReadServiceFactory extends PublicReadServiceFactoryBase {
  (args: { publicLinkId: string }): PublicAlbumReadService;
}

type PublicAlbumReadServiceFactoryDeps = {
  albumReadRepository: AlbumReadRepository;
  mediaItemReadRepository: MediaItemReadRepository;
};

export const build__PublicAlbumReadServiceFactory = ({
  albumReadRepository,
  mediaItemReadRepository,
}: PublicAlbumReadServiceFactoryDeps): PublicAlbumReadServiceFactory => {
  return ({ publicLinkId }: { publicLinkId: string }) => {
    const enrichWithTags = async (
      items: Omit<MediaItemProjection, 'tags'>[],
    ): Promise<MediaItemProjection[]> => {
      if (items.length === 0) {
        return [];
      }
      const tagMap = await mediaItemReadRepository.listTagsForMediaItemIds({
        mediaItemIds: items.map((i) => i.id),
      });
      return items.map((item) => ({ ...item, tags: tagMap.get(item.id) ?? [] }));
    };

    return {
      getAlbum: async (albumId: string): Promise<PublicAlbumProjection | undefined> => {
        const row = await albumReadRepository.getAlbumForShareLink({ albumId, publicLinkId });
        if (!row) {
          return undefined;
        }
        const cover =
          row.mediaItemId != null
            ? (await enrichWithTags([mapMediaItemRowToProjection(row)]))[0]
            : undefined;
        return {
          id: row.id,
          title: row.title,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          coverMedia: cover,
        };
      },

      getViewableAlbumItems: async ({
        albumId,
        collectionInfo,
      }: {
        albumId: string;
        collectionInfo: PublicAlbumItemCollectionInfo;
      }): Promise<PublicAlbumItemListProjection> => {
        const albumItems = await albumReadRepository.listAlbumItemsForShareLink({
          albumId,
          publicLinkId,
          collectionInfo,
        });
        const mediaBases = albumItems.map((albumItem) => mapMediaItemRowToProjection(albumItem));
        const mediaEnriched = await enrichWithTags(mediaBases);
        const nodes = albumItems.map((albumItem, index) => ({
          id: albumItem.id,
          orderIndex: albumItem.albumItemOrderIndex,
          mediaItem: mediaEnriched[index],
          createdAt: albumItem.createdAt,
          updatedAt: albumItem.updatedAt,
        }));
        return {
          nodes,
          pageInfo: collectionInfo.pageInfo,
        };
      },
    };
  };
};
