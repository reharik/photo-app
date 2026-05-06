import { SharePermission } from '@packages/contracts';
import { AuthorizationReadRepository } from '../../../repositories/readRepositories/authorizationReadRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/shareContactRepository';
import {
  SharedWithMedMediaItemRow,
  SharedWithMeReadRepository,
} from '../../../repositories/readRepositories/sharedWithMeReadRepository';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { MediaItemProjection } from './viewerMediaItemReadService.types';

export type AuthorizationProjection = {
  id: EntityId;
  grantedToUserId?: EntityId;
  permission: SharePermission;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt?: Date;
};

export type SharedWithMeItemProjection = {
  id: EntityId;
  sharedAt: Date;
  sharedBy: EntityId;
  mediaItem: MediaItemProjection;
};

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
    mediaItem: {
      id: mediaItem.mediaItemId,
      ownerId: mediaItem.mediaItemOwnerId ?? '',
      kind: mediaItem.mediaItemKind,
      status: mediaItem.mediaItemStatus,
      mimeType: mediaItem.mediaItemMimeType ?? '',
      sizeBytes: mediaItem.mediaItemSizeBytes ?? 0,
      originalFileName: mediaItem.mediaItemOriginalFileName ?? undefined,
      width: mediaItem.mediaItemWidth,
      height: mediaItem.mediaItemHeight,
      durationSeconds: mediaItem.mediaItemDurationSeconds,
      title: mediaItem.mediaItemTitle,
      description: mediaItem.mediaItemDescription,
      takenAt: mediaItem.mediaItemTakenAt,
      createdAt: mediaItem.mediaItemCreatedAt ?? new Date(),
      updatedAt: mediaItem.mediaItemUpdatedAt ?? new Date(),
      tags: [],
    },
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
