import { SharePermission } from '@packages/contracts';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import {
  ensureUserExists,
  loadRequiredMediaItem,
} from '../../../application/support/resourceLoaders';
import { Share } from '../../../domain/Share/Share';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { ActorId, EntityId, WriteResult } from '../../../types/types';

export const buildGrantMediaItemShare =
  ({
    mediaItemRepository,
    userRepository,
  }: {
    mediaItemRepository: MediaItemRepository;
    userRepository: UserRepository;
  }) =>
  async (
    mediaItemId: EntityId,
    permission: SharePermission,
    actorId: ActorId,
    grantedToUserId?: EntityId,
    grantedToHandle?: string,
    token?: string,
    label?: string,
    expiresAt?: Date,
  ): Promise<WriteResult<Share>> => {
    const getResult = await loadRequiredMediaItem(mediaItemId, mediaItemRepository);
    if (!getResult.success) {
      return getResult;
    }
    const mediaItem = getResult.value;
    const ensureResult = ensureMediaItemOwnedByViewer(mediaItem.ownerId(), actorId);
    if (!ensureResult.success) {
      return ensureResult;
    }
    if (grantedToHandle) {
      const ensureUser = await ensureUserExists(grantedToHandle, userRepository);
      if (!ensureUser.success) {
        return fail(ensureUser.error);
      }
      const user = ensureUser.value;
      grantedToUserId = user.id();
    }

    const result = mediaItem.grantShare(
      permission,
      actorId,
      grantedToUserId,
      token,
      label,
      expiresAt,
    );
    if (!result.success) {
      return result;
    }
    // save mediaItem
    // create grant
    // add userHandle to user_interaction ( which needs to be made )

    // Do something with no-op result if needed
    return ok(result.value.share);
  };
