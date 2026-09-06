import { DateTime } from 'luxon';
import { DBMediaItemRow, NamespacedMediaItemRow } from './types';

export const mapMediaItemRowToDBMediaItemRow = (
  mediaItem: NamespacedMediaItemRow,
): DBMediaItemRow => {
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
    createdAt: mediaItem.mediaItemCreatedAt ?? DateTime.now(),
    updatedAt: mediaItem.mediaItemUpdatedAt ?? DateTime.now(),
    reactionCounts: mediaItem.mediaItemReactionCounts,
  };
};
