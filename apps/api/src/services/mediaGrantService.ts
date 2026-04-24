import { AppErrorCollection, MediaAssetKind } from '@packages/contracts';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  fail,
  hashToken,
  ok,
  resolvePreferredAssetKind,
  WriteResult,
} from '@packages/media-core';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type MediaGrantServiceDeps = Pick<
  IocGeneratedCradle,
  'mediaItemReadRepository' | 'mediaAssetReadRepository' | 'grantReadRepository'
>;

export type AuthorizeMediaViewInput = {
  mediaId: string;
  variant: MediaAssetKind;
  viewerId?: string;
  shareToken?: string;
};

export type MediaGrantService = {
  authorizeView: (input: AuthorizeMediaViewInput) => Promise<WriteResult<string>>;
};

export const buildMediaGrantService = ({
  mediaItemReadRepository,
  mediaAssetReadRepository,
  grantReadRepository,
}: MediaGrantServiceDeps): MediaGrantService => ({
  authorizeView: async (input: AuthorizeMediaViewInput): Promise<WriteResult<string>> => {
    const { mediaId, variant, viewerId, shareToken } = input;

    if (!viewerId && !shareToken) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
    }

    const row = await mediaItemReadRepository.getByIdForAuthorization({ mediaItemId: mediaId });

    if (!row) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotFound);
    }

    const isOwner = viewerId !== undefined && row.ownerId === viewerId;

    if (!isOwner) {
      const granted = await grantReadRepository.hasActiveGrant({
        mediaItemId: mediaId,
        viewerId,
        tokenHash: shareToken ? hashToken(shareToken) : undefined,
      });

      if (!granted) {
        return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
      }
    }

    /**
     * Derivatives (display, thumbnail) are produced asynchronously by the media worker after
     * upload finalize. While the worker is still running, the requested variant may not yet
     * exist in object storage. Fall back to the original so the route never hands out a signed
     * URL for a missing key.
     */
    const assetsByMediaItem = await mediaAssetReadRepository.listByMediaItemIds([row.id]);
    const assets = assetsByMediaItem.get(row.id) ?? [];
    const resolvedKind = resolvePreferredAssetKind(assets, variant);

    const baseStorageKey = buildMediaItemBaseStorageKey(row.ownerId, row.id);
    return ok(buildMediaAssetStorageKey(baseStorageKey, resolvedKind));
  },
});
