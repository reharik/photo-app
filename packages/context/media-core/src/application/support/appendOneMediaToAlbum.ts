import { all, EntityId, Operation, OperationResult } from '@packages/contracts';
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

  const checks = all(
    () => ensureMediaItemOwnedByViewer(ownerId, viewerId),
    () => ensureMemberCanEditAlbum(album, Operation.addItems, viewerId),
    () => ensureMediaItemInReadyState(mediaItem),
  );
  if (!checks.success) {
    return checks;
  }
  return album.addItem(mediaItemId, viewerId, kind);
};
