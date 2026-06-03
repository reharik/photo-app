import { indexByUnique } from '@packages/infrastructure';
import { EnrichMediaItems } from '../..';
import { SharedWithMeReadRepository } from '../../../repositories/readRepositories/types';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { mapMediaItemRowToDBMediaItemRow } from '../readServiceMappers';
import {
  PagedList,
  SharedWithMeItemProjection,
  SharedWithMeMediaItemCollectionInfo,
} from '../types';

export interface ViewerSharedWithMeMediaItemReadService {
  getSharedWithMeMediaItems: (
    collectionInfo: SharedWithMeMediaItemCollectionInfo,
  ) => Promise<PagedList<SharedWithMeItemProjection>>;
}

export interface ViewerSharedWithMeMediaItemReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: EntityId }): ViewerSharedWithMeMediaItemReadService;
}

type ViewerSharedWithMeMediaItemReadServiceFactoryDeps = {
  sharedWithMeReadRepository: SharedWithMeReadRepository;
  enrichMediaItems: EnrichMediaItems;
};

export const build__ViewerSharedWithMeMediaItemReadServiceFactory = ({
  sharedWithMeReadRepository,
  enrichMediaItems,
}: ViewerSharedWithMeMediaItemReadServiceFactoryDeps): ViewerSharedWithMeMediaItemReadServiceFactory => {
  return ({ viewerId }: { viewerId: EntityId }) => ({
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
  });
};
