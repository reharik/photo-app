import { MediaAssetKind } from '@packages/contracts';
import type { MediaStorage } from './MediaStorage';
import { buildMediaAssetStorageKey } from './MediaStorage';

/**
 * Presigned (or public) URLs for thumbnail and display objects under `baseStorageKey`,
 * derived from storage layout only — no media_asset table reads.
 */
export const createDerivedMediaItemUrl = async (input: {
  mediaStorage: MediaStorage;
  baseStorageKey: string;
  kind: MediaAssetKind;
}): Promise<string> => {
  const key = buildMediaAssetStorageKey(input.baseStorageKey, input.kind);
  return await input.mediaStorage.getObjectAccessUrl({ storageKey: key });
};
