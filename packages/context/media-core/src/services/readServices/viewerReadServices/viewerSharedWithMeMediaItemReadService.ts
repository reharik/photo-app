import { indexByUnique } from '@packages/infrastructure';
import { EnrichMediaItems, ReadServiceBase } from '../..';
import { SharedWithMeReadRepository } from '../../../repositories/readRepositories/types';
import { mapMediaItemRowToDBMediaItemRow } from '../readServiceMappers';
import {
  PagedList,
  SharedWithMeItemProjection,
  SharedWithMeMediaItemCollectionInfo,
} from '../types';

export interface ViewerSharedWithMeMediaItemReadService extends ReadServiceBase {
  getSharedWithMeMediaItems: (
    collectionInfo: SharedWithMeMediaItemCollectionInfo,
  ) => Promise<PagedList<SharedWithMeItemProjection>>;
}

type ViewerSharedWithMeMediaItemReadServiceDeps = {
  sharedWithMeReadRepository: SharedWithMeReadRepository;
  enrichMediaItems: EnrichMediaItems;
  viewerId: string;
};

export const build__ViewerSharedWithMeMediaItemReadService = ({
  sharedWithMeReadRepository,
  enrichMediaItems,
  viewerId,
}: ViewerSharedWithMeMediaItemReadServiceDeps): ViewerSharedWithMeMediaItemReadService => {
  return {
    getSharedWithMeMediaItems: async (collectionInfo: SharedWithMeMediaItemCollectionInfo) => {
      const rows = await sharedWithMeReadRepository.getMediaItemsSharedWithMe({
        viewerId,
        collectionInfo,
      });
      const sharedWithMeMediaItems = rows.nodes.map(mapMediaItemRowToDBMediaItemRow);
      const mediaItems = await enrichMediaItems.enrich(viewerId, sharedWithMeMediaItems);
      const mediaItemsMap = indexByUnique(mediaItems);
      const items = rows.nodes.map((sharedItem) => ({
        id: sharedItem.id,
        sharedAt: sharedItem.sharedAt,
        sharedBy: sharedItem.sharedBy,
        operations: [],
        mediaItem: mediaItemsMap.get(sharedItem.mediaItemId)!,
      }));
      return {
        nodes: items,
        totalCount: rows.totalCount,
      };
    },
  };
};
