import { AppErrorCollection, EntityId, fail, MediaItemStatus, ok } from '@packages/contracts';
import { DBMediaItemRow, MediaItem } from '../..';

export const ensureMediaItemOwnedByViewer = (ownerId: EntityId, viewerId: EntityId) =>
  ownerId === viewerId
    ? ok(undefined)
    : fail(AppErrorCollection.mediaItem.MediaItemNotOwnedByViewer);

export const ensureMediaItemInReadyState = (mediaItem: DBMediaItemRow | MediaItem) => {
  const status = mediaItem instanceof MediaItem ? mediaItem.status() : mediaItem.status;
  return status.equals(MediaItemStatus.ready)
    ? ok(undefined)
    : fail(AppErrorCollection.mediaItem.MediaItemNotReady);
};
