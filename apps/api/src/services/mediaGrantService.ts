import { AppErrorCollection, MediaAssetKind } from '@packages/contracts';
import { fail, hashToken, ok, WriteResult } from '@packages/media-core';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type MediaGrantServiceDeps = Pick<
  IocGeneratedCradle,
  'mediaItemReadRepository' | 'grantReadRepository'
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

    // Fast path — owner, no grant lookup needed
    if (viewerId && row.ownerId === viewerId) {
      return ok(`media/${row.ownerId}/${row.id}/${variant.key}`);
    }

    // Grant path — shared user or token
    const granted = await grantReadRepository.hasActiveGrant({
      mediaItemId: mediaId,
      viewerId,
      tokenHash: shareToken ? hashToken(shareToken) : undefined,
    });

    if (!granted) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
    }

    return ok(`media/${row.ownerId}/${row.id}/${variant.key}`);
  },
});
