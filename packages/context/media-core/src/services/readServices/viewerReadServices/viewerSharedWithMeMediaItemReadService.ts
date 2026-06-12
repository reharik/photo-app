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
      const dbMediaItems = rows.nodes.map(mapMediaItemRowToDBMediaItemRow);

      const enrichedMediaItems = await enrichMediaItems.enrich(viewerId, dbMediaItems);
      const mediaItemsMap = indexByUnique(enrichedMediaItems);

      const nodes = rows.nodes.map((sharedItem) => ({
        id: sharedItem.grantId,
        sharedAt: sharedItem.sharedAt,
        sharedBy: sharedItem.sharedBy,
        mediaItem: mediaItemsMap.get(sharedItem.mediaItemId)!,
      }));

      return {
        nodes,
        totalCount: rows.totalCount,
      };
    },
  };
};
