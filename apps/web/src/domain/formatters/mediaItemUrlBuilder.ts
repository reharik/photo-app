import { MediaAssetKind } from '@packages/contracts';

export const buildMediaItemUrl = (mediaItemId: string, variant: MediaAssetKind) => {
  return `/api/media/${mediaItemId}/${variant.key}`;
};
