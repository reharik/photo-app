import { AlbumMemberRole } from '@packages/contracts';
import { AuthorizationReadRepository } from '../../../repositories/readRepositories/authorizationReadRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import {
  ShareContactRepository,
  ShareContactSuggestion,
} from '../../../repositories/readRepositories/shareContactRepository';
import { SharedWithMeReadRepository } from '../../../repositories/readRepositories/sharedWithMeReadRepository';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { NamespacedMediaItemRow } from './viewerAlbumReadService.types';
import { MediaItemProjection } from './viewerMediaItemReadService.types';

export type AuthorizationProjection = {
  id: EntityId;
  grantedToUserId?: EntityId;
  permission: string;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt?: Date;
};

export type SharedWithMeItemProjection = {
  id: EntityId;
  permission: string;
  sharedAt: Date;
  sharedBy: EntityId;
  mediaItem: MediaItemProjection;
};

export interface ViewerAlbumAuthzReadService {
  getAuthz: (args: { viewerMemberRole?: string }) => string[];
  getShareContacts: () => Promise<ShareContactSuggestion[]>;
  getSharedWithMeMediaItems: () => Promise<{
    mediaItems: SharedWithMeItemProjection[];
  }>;
}

export interface ViewerAlbumAuthzReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: EntityId }): ViewerAlbumAuthzReadService;
}

type ViewerAlbumAuthzReadServiceFactoryDeps = {
  authorizationReadRepository: AuthorizationReadRepository;
  shareContactRepository: ShareContactRepository;
  sharedWithMeReadRepository: SharedWithMeReadRepository;
  mediaItemReadRepository: MediaItemReadRepository;
};

const mapNamespacedToMediaItemBase = (
  mediaItem: NamespacedMediaItemRow,
): Omit<MediaItemProjection, 'tags'> => {
  const id = mediaItem.mediaItemId ?? '';
  return {
    id,
    ownerId: mediaItem.mediaItemOwnerId ?? '',
    kind: mediaItem.mediaItemKind ?? '',
    status: mediaItem.mediaItemStatus ?? '',
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
  };
};

export const buildViewerAlbumAuthzReadServiceFactory = ({
  shareContactRepository,
  sharedWithMeReadRepository,
  mediaItemReadRepository,
}: ViewerAlbumAuthzReadServiceFactoryDeps): ViewerAlbumAuthzReadServiceFactory => {
  return ({ viewerId }: { viewerId: EntityId }) => ({
    getAuthz: ({ viewerMemberRole }: { viewerMemberRole?: string }): string[] => {
      if (!viewerMemberRole) {
        return [];
      }
      const role = AlbumMemberRole.fromValue(viewerMemberRole);
      if (!role) {
        return [];
      }
      return role.operations.map((op) => op.value);
    },
    getShareContacts: async (): Promise<ShareContactSuggestion[]> => {
      return shareContactRepository.getShareSuggestions(viewerId);
    },
    getSharedWithMeMediaItems: async () => {
      const { sharedWithMeMediaItems, sharedWithMeAlbums } =
        await sharedWithMeReadRepository.getItemsSharedWithMe(viewerId);

      const allMediaBases: Omit<MediaItemProjection, 'tags'>[] = [
        ...sharedWithMeMediaItems.map((row) => mapNamespacedToMediaItemBase(row)),
        ...sharedWithMeAlbums
          .filter((row) => row.mediaItemId != null)
          .map((row) => mapNamespacedToMediaItemBase(row)),
      ];

      const tagMap = await mediaItemReadRepository.listTagsForMediaItemIds({
        mediaItemIds: allMediaBases.map((m) => m.id),
      });
      const withTags = (base: Omit<MediaItemProjection, 'tags'>): MediaItemProjection => ({
        ...base,
        tags: tagMap.get(base.id) ?? [],
      });

      const mediaItems: SharedWithMeItemProjection[] = sharedWithMeMediaItems.map((row) => {
        const base = mapNamespacedToMediaItemBase(row);
        return {
          id: row.id,
          permission: row.permission,
          sharedAt: row.sharedAt,
          sharedBy: row.sharedBy,
          mediaItem: withTags(base),
        };
      });

      return { mediaItems };
    },
  });
};
