import { MediaAssetKind } from '@packages/contracts';

import type { MediaItem } from '../../domain/MediaItem/MediaItem';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  type MediaStorage,
} from './MediaStorage';

/**
 * Removes derivative and original objects for the given items. Calls are idempotent per
 * {@link MediaStorage.deleteObject} contract (missing keys succeed).
 */
export const deleteStoredAssetsForMediaItems = async (
  mediaStorage: MediaStorage,
  mediaItems: readonly MediaItem[],
): Promise<void> => {
  for (const item of mediaItems) {
    const base = buildMediaItemBaseStorageKey(item.ownerId(), item.id());
    for (const kind of MediaAssetKind.items()) {
      await mediaStorage.deleteObject(buildMediaAssetStorageKey(base, kind));
    }
  }
};
