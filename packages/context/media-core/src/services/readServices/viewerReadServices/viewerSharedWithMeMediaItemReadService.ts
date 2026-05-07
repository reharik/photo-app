import { AuthorizationReadRepository } from '../../../repositories/readRepositories/authorizationReadRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/shareContactRepository';
import {
  SharedWithMedMediaItemRow,
  SharedWithMeReadRepository,
} from '../../../repositories/readRepositories/sharedWithMeReadRepository';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { mapMediaItemRowToProjection } from '../readServiceMappers';
import { SharedWithMeItemProjection } from '../types';

export interface ViewerSharedWithMeMediaItemReadService {
  getSharedWithMeMediaItems: () => Promise<{
    mediaItems: SharedWithMeItemProjection[];
  }>;
}

export interface ViewerSharedWithMeMediaItemReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: EntityId }): ViewerSharedWithMeMediaItemReadService;
}

type ViewerSharedWithMeMediaItemReadServiceFactoryDeps = {
  authorizationReadRepository: AuthorizationReadRepository;
  shareContactRepository: ShareContactRepository;
  sharedWithMeReadRepository: SharedWithMeReadRepository;
  mediaItemReadRepository: MediaItemReadRepository;
};

export const mapNamespacedToMediaItemBase = (
  mediaItem: SharedWithMedMediaItemRow,
): SharedWithMeItemProjection => {
  return {
    id: mediaItem.id,
    sharedAt: mediaItem.sharedAt,
    sharedBy: mediaItem.sharedBy,
    mediaItem: { ...mapMediaItemRowToProjection(mediaItem), tags: [] },
  };
};

export const build__ViewerSharedWithMeMediaItemReadServiceFactory = ({
  sharedWithMeReadRepository,
  mediaItemReadRepository,
}: ViewerSharedWithMeMediaItemReadServiceFactoryDeps): ViewerSharedWithMeMediaItemReadServiceFactory => {
  return ({ viewerId }: { viewerId: EntityId }) => ({
    getSharedWithMeMediaItems: async () => {
      const { sharedWithMeMediaItems: items } =
        await sharedWithMeReadRepository.getMediaItemsSharedWithMe(viewerId);
      const sharedWithMeMediaItems = items.map((row) => mapNamespacedToMediaItemBase(row));

      const tagMap = await mediaItemReadRepository.listTagsForMediaItemIds({
        mediaItemIds: sharedWithMeMediaItems.map((m) => m.id),
      });
      const withTags = (base: SharedWithMeItemProjection): SharedWithMeItemProjection => ({
        ...base,
        mediaItem: { ...base.mediaItem, tags: tagMap.get(base.id) ?? [] },
      });

      const mediaItems: SharedWithMeItemProjection[] = sharedWithMeMediaItems.map((row) =>
        withTags(row),
      );

      return { mediaItems };
    },
  });
};
