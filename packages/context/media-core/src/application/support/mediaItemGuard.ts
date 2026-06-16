import { AppErrorCollection, fail, MediaItemStatus, ok } from '@packages/contracts';
import { DBMediaItemRow, EntityId } from '../..';

export const ensureMediaItemOwnedByViewer = (ownerId: EntityId, viewerId: EntityId) =>
  ownerId === viewerId
    ? ok(undefined)
    : fail(AppErrorCollection.mediaItem.MediaItemNotOwnedByViewer);

export const ensureMediaItemInReadyState = (mediaItem: DBMediaItemRow) =>
  mediaItem.status.equals(MediaItemStatus.ready)
    ? ok(undefined)
    : fail(AppErrorCollection.mediaItem.MediaItemNotReady);
