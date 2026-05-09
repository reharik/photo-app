import { AppErrorCollection } from '@packages/contracts';
import { buildMediaItemBaseStorageKey, fail, ok, WriteResult } from '@packages/media-core';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type AuthorizeMediaViewInput = {
  mediaId: string;
  viewerId?: string;
  hashedToken?: string;
};

export type MediaGrantService = {
  authorizeView: (input: AuthorizeMediaViewInput) => Promise<WriteResult<string>>;
};

export const build__MediaGrantService = ({
  mediaItemReadRepository,
  grantReadRepository,
}: IocGeneratedCradle): MediaGrantService => ({
  authorizeView: async (input: AuthorizeMediaViewInput): Promise<WriteResult<string>> => {
    const { mediaId, viewerId, hashedToken } = input;
    if (!viewerId && !hashedToken) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
    }

    const mediaItemRow = await mediaItemReadRepository.getByIdForAuthorization({
      mediaItemId: mediaId,
    });
    if (!mediaItemRow) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotFound);
    }

    const isOwner = viewerId !== undefined && mediaItemRow.ownerId === viewerId;

    if (isOwner) {
      return ok(buildMediaItemBaseStorageKey(mediaItemRow.ownerId, mediaItemRow.id));
    }

    const granted = await grantReadRepository.hasActiveGrant({
      mediaItemId: mediaId,
      viewerId,
      tokenHash: hashedToken,
    });

    if (!granted) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
    }

    const baseStorageKey = buildMediaItemBaseStorageKey(mediaItemRow.ownerId, mediaItemRow.id);
    return ok(baseStorageKey);
  },
});
