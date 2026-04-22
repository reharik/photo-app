import {
  createDerivedMediaItemUrls,
  type MediaItemDerivedUrlsProjection,
} from '../../../application/media/buildDerivedMediaItemUrls';
import { MediaStorage } from '../../../application/media/MediaStorage';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import {
  MediaItemCollectionInfo,
  MediaItemListProjection,
  MediaItemProjection,
  MediaItemRow,
} from './viewerMediaItemReadService.types';

export interface ViewerMediaItemReadService {
  listMediaItems: (collectionInfo: MediaItemCollectionInfo) => Promise<MediaItemListProjection>;
  getMediaItemForViewer: (args: {
    mediaItemId: EntityId;
  }) => Promise<MediaItemProjection | undefined>;
  getDerivedUrlsForMediaItem: (args: {
    mediaItemStorageKey: string;
  }) => Promise<MediaItemDerivedUrlsProjection>;
}

export interface ViewerMediaItemReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): ViewerMediaItemReadService;
}

type ViewerMediaItemReadServiceFactoryDeps = {
  mediaItemReadRepository: MediaItemReadRepository;
  mediaStorage: MediaStorage;
};

export const buildViewerMediaItemReadServiceFactory = ({
  mediaItemReadRepository,
  mediaStorage,
}: ViewerMediaItemReadServiceFactoryDeps): ViewerMediaItemReadServiceFactory => {
  const getDerivedUrlsForMediaItem = async ({
    mediaItemStorageKey,
  }: {
    mediaItemStorageKey: string;
  }): Promise<MediaItemDerivedUrlsProjection> => {
    return createDerivedMediaItemUrls({
      mediaStorage,
      baseStorageKey: mediaItemStorageKey,
    });
  };

  return ({ viewerId }: { viewerId: string }) => {
    const withTags = async (rows: MediaItemRow[]): Promise<MediaItemProjection[]> => {
      const ids = rows.map((r) => r.id);
      const tagMap = await mediaItemReadRepository.listTagsForMediaItemIds({
        viewerId,
        mediaItemIds: ids,
      });
      return rows.map((r) => ({ ...r, tags: tagMap.get(r.id) ?? [] }));
    };

    return {
      listMediaItems: async (
        collectionInfo: MediaItemCollectionInfo,
      ): Promise<MediaItemListProjection> => {
        const mediaItems = await mediaItemReadRepository.listForViewer({
          viewerId,
          collectionInfo,
        });
        const nodes = await withTags(mediaItems);
        return {
          nodes,
          pageInfo: collectionInfo.pageInfo,
        };
      },
      getMediaItemForViewer: async ({
        mediaItemId,
      }: {
        mediaItemId: EntityId;
      }): Promise<MediaItemProjection | undefined> => {
        const row = await mediaItemReadRepository.getForViewer({ mediaItemId, viewerId });
        if (!row) {
          return undefined;
        }
        const [projection] = await withTags([row]);
        return projection;
      },
      getDerivedUrlsForMediaItem,
    };
  };
};
