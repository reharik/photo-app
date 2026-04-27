import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import {
  ShareContactRepository,
  ShareContactSuggestion,
} from '../../../repositories/readRepositories/shareContactRepository';
import { ShareReadRepository } from '../../../repositories/readRepositories/shareReadRepository';
import { SharedWithMeReadRepository } from '../../../repositories/readRepositories/sharedWithMeReadRepository';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { NamespacedMediaItemRow } from './viewerAlbumReadService.types';
import { MediaItemProjection } from './viewerMediaItemReadService.types';

export type ShareProjection = {
  id: EntityId;
  grantedToUserId?: EntityId;
  permission: string;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
};

export type SharedWithMeItemProjection = {
  id: EntityId;
  permission: string;
  sharedAt: Date;
  sharedBy: EntityId;
  mediaItem: MediaItemProjection;
};

export interface ViewerShareReadService {
  getMediaItemShares: (args: { mediaItemId: EntityId }) => Promise<ShareProjection[]>;
  getAlbumShares: (args: { albumId: EntityId }) => Promise<ShareProjection[]>;
  getShareContacts: () => Promise<ShareContactSuggestion[]>;
  getSharedMediaItems: () => Promise<{
    mediaItems: SharedWithMeItemProjection[];
  }>;
}

export interface ViewerShareReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: EntityId }): ViewerShareReadService;
}

type ViewerShareReadServiceFactoryDeps = {
  shareReadRepository: ShareReadRepository;
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

export const buildViewerShareReadServiceFactory = ({
  shareReadRepository,
  shareContactRepository,
  sharedWithMeReadRepository,
  mediaItemReadRepository,
}: ViewerShareReadServiceFactoryDeps): ViewerShareReadServiceFactory => {
  return ({ viewerId }: { viewerId: EntityId }) => ({
    getMediaItemShares: async ({
      mediaItemId,
    }: {
      mediaItemId: EntityId;
    }): Promise<ShareProjection[]> => {
      const rows = await shareReadRepository.listSharesForOwnedMediaItem({
        mediaItemId,
        ownerId: viewerId,
      });
      return rows.map((row) => ({
        id: row.id,
        grantedToUserId: row.grantedToUser,
        permission: row.permission.value,
        label: row.description,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
      }));
    },
    getAlbumShares: async ({ albumId }: { albumId: EntityId }): Promise<ShareProjection[]> => {
      const rows = await shareReadRepository.listSharesForOwnedAlbum({
        albumId,
        ownerId: viewerId,
      });
      return rows.map((row) => ({
        id: row.id,
        grantedToUserId: row.grantedToUser,
        permission: row.permission.value,
        label: row.description,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
      }));
    },
    getShareContacts: async (): Promise<ShareContactSuggestion[]> => {
      return shareContactRepository.getShareSuggestions(viewerId);
    },
    getSharedMediaItems: async () => {
      const sharedMediaItems = await sharedWithMeReadRepository.getSharedMediaItems(viewerId);

      const allMediaBases: Omit<MediaItemProjection, 'tags'>[] = sharedMediaItems.map((row) =>
        mapNamespacedToMediaItemBase(row),
      );
      const tagMap = await mediaItemReadRepository.listTagsForMediaItemIds({
        viewerId,
        mediaItemIds: allMediaBases.map((m) => m.id),
      });
      const withTags = (base: Omit<MediaItemProjection, 'tags'>): MediaItemProjection => ({
        ...base,
        tags: tagMap.get(base.id) ?? [],
      });

      const mediaItems: SharedWithMeItemProjection[] = sharedMediaItems.map((row) => {
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
