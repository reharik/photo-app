import { AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import {
  buildMediaItemBaseStorageKey,
  GrantReadRepository,
  MediaItemReadRepository,
} from '@packages/media-core';

export type AuthorizeMediaViewInput = {
  mediaId: string;
  viewerId?: string;
  hashedToken?: string;
};

export type MediaGrantService = {
  authorizeView: (input: AuthorizeMediaViewInput) => Promise<WriteResult<string>>;
};

type MediaGrantServiceDeps = {
  mediaItemReadRepository: MediaItemReadRepository;
  grantReadRepository: GrantReadRepository;
};
export const build__MediaGrantService = ({
  mediaItemReadRepository,
  grantReadRepository,
}: MediaGrantServiceDeps): MediaGrantService => ({
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
