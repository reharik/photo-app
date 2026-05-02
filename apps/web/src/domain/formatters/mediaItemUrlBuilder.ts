import { MediaAssetKind } from '@packages/contracts';

export const buildMediaItemUrl = (mediaItemId: string, variant: MediaAssetKind) => {
  return `/media/${mediaItemId}/${variant.key}`;
};
