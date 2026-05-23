import { MediaAssetKind } from '@packages/contracts';
import type { MediaStorage } from './MediaStorage';
import { buildMediaAssetStorageKey } from './MediaStorage';

type AssetStatusSource = {
  kind: string;
  status: string;
};

const normalizeKind = (kind: string): string => kind.trim().toLowerCase();
const normalizeStatus = (status: string): string => status.trim().toLowerCase();

const isAssetReady = (asset: AssetStatusSource): boolean =>
  normalizeStatus(asset.status) === 'ready';

const hasReadyAssetKind = (assets: AssetStatusSource[], requestedKind: MediaAssetKind): boolean => {
  const requestedKindValue = normalizeKind(requestedKind.value);
  return assets.some(
    (asset) => normalizeKind(asset.kind) === requestedKindValue && isAssetReady(asset),
  );
};

export const resolvePreferredAssetKind = (
  assets: AssetStatusSource[],
  requestedKind: MediaAssetKind,
): MediaAssetKind => {
  if (requestedKind.equals(MediaAssetKind.original)) {
    return MediaAssetKind.original;
  }
  return hasReadyAssetKind(assets, requestedKind) ? requestedKind : MediaAssetKind.original;
};

export const resolveMediaAssetUrl = async (input: {
  mediaStorage: MediaStorage;
  baseStorageKey: string;
  requestedKind: MediaAssetKind;
  assets: AssetStatusSource[];
}): Promise<{
  url: string;
  storageKey: string;
  resolvedKind: MediaAssetKind;
  fallbackToOriginal: boolean;
}> => {
  const resolvedKind = resolvePreferredAssetKind(input.assets, input.requestedKind);
  const storageKey = buildMediaAssetStorageKey(input.baseStorageKey, resolvedKind);
  const url = await input.mediaStorage.getObjectAccessUrl({ storageKey });
  return {
    url,
    storageKey,
    resolvedKind,
    fallbackToOriginal: !resolvedKind.equals(input.requestedKind),
  };
};
