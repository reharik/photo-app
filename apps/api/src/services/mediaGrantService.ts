import { AppErrorCollection, fail, ok, OperationResult } from '@packages/contracts';
import { buildMediaItemBaseStorageKey, SystemMediaGrantRepository } from '@packages/media-core';

export type AuthorizeMediaViewInput = {
  mediaId: string;
  viewerId?: string;
  token?: string;
};

export type MediaGrantService = {
  authorizeView: (input: AuthorizeMediaViewInput) => Promise<OperationResult<string>>;
};

type MediaGrantServiceDeps = {
  systemMediaGrantRepository: SystemMediaGrantRepository;
};
export const build__MediaGrantService = ({
  systemMediaGrantRepository,
}: MediaGrantServiceDeps): MediaGrantService => ({
  authorizeView: async (input: AuthorizeMediaViewInput): Promise<OperationResult<string>> => {
    const { mediaId, viewerId, token } = input;
    if (!viewerId && !token) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
    }

    const mediaItemOwnerId = await systemMediaGrantRepository.getMediaItemOwnerId({
      mediaItemId: mediaId,
    });
    if (!mediaItemOwnerId) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotFound);
    }

    const isOwner = viewerId !== undefined && mediaItemOwnerId.ownerId === viewerId;

    if (isOwner) {
      return ok(buildMediaItemBaseStorageKey(mediaItemOwnerId.ownerId, mediaItemOwnerId.id));
    }

    const granted = await systemMediaGrantRepository.hasActiveGrant({
      mediaItemId: mediaId,
      viewerId,
      token,
    });

    if (granted) {
      return ok(buildMediaItemBaseStorageKey(mediaItemOwnerId.ownerId, mediaItemOwnerId.id));
    }

    if (viewerId) {
      const memberGrant = await systemMediaGrantRepository.hasAlbumMembershipForMediaItem({
        mediaItemId: mediaId,
        viewerId,
      });

      if (memberGrant) {
        return ok(buildMediaItemBaseStorageKey(mediaItemOwnerId.ownerId, mediaItemOwnerId.id));
      }
    }

    return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
  },
});
