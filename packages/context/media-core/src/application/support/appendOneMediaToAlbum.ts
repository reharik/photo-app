import type { ContractError } from '@packages/contracts';
import { ViewerOperation } from '@packages/contracts';
import { Album } from '../../domain/Album/Album';
import type { AlbumItem } from '../../domain/Album/AlbumItem';
import type { MediaItemRow } from '../../services/readServices/types';
import { EntityId, WriteResult } from '../../types/types';
import { ensureMemberCanEditAlbum } from './albumguard';
import { ensureMediaItemInReadyState, ensureMediaItemOwnedByViewer } from './mediaItemGuard';

/**
 * Applies the same per-item rules as single `addAlbumItem` (ownership, album role, ready state, domain addItem).
 */
export const tryAppendOneMediaToAlbum = (
  album: Album,
  mediaItem: MediaItemRow,
  mediaItemId: EntityId,
  viewerId: EntityId,
): WriteResult<AlbumItem, ContractError> => {
  const r1 = ensureMediaItemOwnedByViewer(mediaItem.ownerId, viewerId);
  if (!r1.success) {
    return r1;
  }
  const r2 = ensureMemberCanEditAlbum(album, ViewerOperation.addItems, viewerId);
  if (!r2.success) {
    return r2;
  }
  const r3 = ensureMediaItemInReadyState(mediaItem);
  if (!r3.success) {
    return r3;
  }
  return album.addItem(mediaItemId, viewerId);
};
