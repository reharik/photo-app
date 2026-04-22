import { MediaAssetKind } from '@packages/contracts';
import type { MediaStorage } from './MediaStorage';
import { buildMediaAssetStorageKey } from './MediaStorage';

export type MediaItemDerivedUrlsProjection = {
  thumbnail: string;
  display: string;
};

/**
 * Presigned (or public) URLs for thumbnail and display objects under `baseStorageKey`,
 * derived from storage layout only — no media_asset table reads.
 */
export const createDerivedMediaItemUrls = async (input: {
  mediaStorage: MediaStorage;
  baseStorageKey: string;
}): Promise<MediaItemDerivedUrlsProjection> => {
  const thumbnailKey = buildMediaAssetStorageKey(input.baseStorageKey, MediaAssetKind.thumbnail);
  const displayKey = buildMediaAssetStorageKey(input.baseStorageKey, MediaAssetKind.display);
  const [thumbnail, display] = await Promise.all([
    input.mediaStorage.getObjectAccessUrl({ storageKey: thumbnailKey }),
    input.mediaStorage.getObjectAccessUrl({ storageKey: displayKey }),
  ]);
  return { thumbnail, display };
};
