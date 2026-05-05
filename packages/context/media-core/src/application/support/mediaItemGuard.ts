import { AppErrorCollection, MediaItemStatus } from '@packages/contracts';
import { EntityId, MediaItemRow } from '../..';
import { fail, ok } from '../../domain/utilities/writeResponse';

export const ensureMediaItemOwnedByViewer = (ownerId: EntityId, viewerId: EntityId) =>
  ownerId === viewerId
    ? ok(undefined)
    : fail(AppErrorCollection.mediaItem.MediaItemNotOwnedByViewer);

export const ensureMediaItemInReadyState = (mediaItem: MediaItemRow) =>
  mediaItem.status === MediaItemStatus.ready
    ? ok(undefined)
    : fail(AppErrorCollection.mediaItem.MediaItemNotReady);
