import { indexByUnique } from '@packages/infrastructure';
import { EnrichMediaItems } from '../..';
import { SharedWithMeReadRepository } from '../../../repositories/readRepositories/types';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { mapMediaItemRowToDBMediaItemRow } from '../readServiceMappers';
import { SharedWithMeItemProjection } from '../types';

export interface ViewerSharedWithMeMediaItemReadService {
  getSharedWithMeMediaItems: () => Promise<SharedWithMeItemProjection[]>;
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
    getSharedWithMeMediaItems: async () => {
      const items = await sharedWithMeReadRepository.getMediaItemsSharedWithMe(viewerId);
      const sharedWithMeMediaItems = items.map(mapMediaItemRowToDBMediaItemRow);
      const mediaItems = await enrichMediaItems.enrich(viewerId, sharedWithMeMediaItems);
      const mediaItemsMap = indexByUnique(mediaItems);
      return items.map((sharedItem) => ({
        id: sharedItem.id,
        sharedAt: sharedItem.sharedAt,
        sharedBy: sharedItem.sharedBy,
        mediaItem: mediaItemsMap.get(sharedItem.mediaItemId)!,
      }));
    },
  });
};
