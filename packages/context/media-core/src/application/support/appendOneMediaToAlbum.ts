import { EntityId, Operation, OperationResult } from '@packages/contracts';
import { MediaItem } from '../../domain';
import { Album } from '../../domain/Album/Album';
import type { AlbumItem } from '../../domain/Album/AlbumItem';
import type { DBMediaItemRow } from '../../services/readServices/types';
import { ensureMemberCanEditAlbum } from './albumguard';
import { ensureMediaItemInReadyState, ensureMediaItemOwnedByViewer } from './mediaItemGuard';

/**
 * Applies the same per-item rules as single `addAlbumItem` (ownership, album role, ready state, domain addItem).
 */
export const tryAppendOneMediaToAlbum = (
  album: Album,
  mediaItem: DBMediaItemRow | MediaItem,
  viewerId: EntityId,
): OperationResult<AlbumItem> => {
  const ownerId = mediaItem instanceof MediaItem ? mediaItem.ownerId() : mediaItem.ownerId;
  const mediaItemId = mediaItem instanceof MediaItem ? mediaItem.id() : mediaItem.id;
  const kind = mediaItem instanceof MediaItem ? mediaItem.kind() : mediaItem.kind;
  const r1 = ensureMediaItemOwnedByViewer(ownerId, viewerId);
  if (!r1.success) {
    return r1;
  }
  const r2 = ensureMemberCanEditAlbum(album, Operation.addItems, viewerId);
  if (!r2.success) {
    return r2;
  }
  const r3 = ensureMediaItemInReadyState(mediaItem);
  if (!r3.success) {
    return r3;
  }
  return album.addItem(mediaItemId, viewerId, kind);
};
