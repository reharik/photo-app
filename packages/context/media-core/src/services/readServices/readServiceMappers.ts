import { MediaItemProjection, NamespacedMediaItemRow } from './types';

export const mapMediaItemRowToProjection = (
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
    title: mediaItem.mediaItemTitle ?? '',
    description: mediaItem.mediaItemDescription,
    takenAt: mediaItem.mediaItemTakenAt,
    createdAt: mediaItem.mediaItemCreatedAt ?? new Date(),
    updatedAt: mediaItem.mediaItemUpdatedAt ?? new Date(),
    reactionCount: mediaItem.mediaItemReactionCount ?? 0,
  };
};
