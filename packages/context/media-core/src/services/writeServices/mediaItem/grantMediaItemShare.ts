import { Knex } from 'knex';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import {
  ensureUserExists,
  loadRequiredMediaItem,
} from '../../../application/support/resourceLoaders';
import { hashToken } from '../../../application/support/tokenHash';
import { Share } from '../../../domain/Share/Share';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { GrantRepository } from '../../../repositories/domainRepositories/grantRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/shareContactRepository';
import { WriteResult } from '../../../types/types';
import { ShareProjection } from '../../readServices/viewerReadServices/viewerShareReadService';
import { WriteServiceBase } from '../writeServiceBaseType';
import { GrantMediaItemShareCommand, GrantShareResult } from './writeMediaItem.types';

const toShareProjection = (share: Share): ShareProjection => ({
  id: share.id(),
  grantedToUserId: share.grantedToUser(),
  permission: share.permission().value,
  label: share.label(),
  expiresAt: share.expiresAt(),
  revokedAt: share.revokedAt(),
  // Share was just created in this transaction; accurate within milliseconds.
  createdAt: new Date(),
});

export interface GrantMediaItemShare extends WriteServiceBase {
  (input: GrantMediaItemShareCommand): Promise<WriteResult<GrantShareResult>>;
}

type GrantMediaItemShareDeps = {
  mediaItemRepository: MediaItemRepository;
  userRepository: UserRepository;
  grantRepository: GrantRepository;
  shareContactRepository: ShareContactRepository;
  database: Knex;
};

export const buildGrantMediaItemShare = ({
  mediaItemRepository,
  userRepository,
  grantRepository,
  shareContactRepository,
  database,
}: GrantMediaItemShareDeps): GrantMediaItemShare => {
  return async (input: GrantMediaItemShareCommand): Promise<WriteResult<GrantShareResult>> => {
    const { viewerId, mediaItemId, permission, grantedToHandle, token, label, expiresAt } = input;
    let { grantedToUserId } = input;

    const getResult = await loadRequiredMediaItem(mediaItemId, mediaItemRepository);
    if (!getResult.success) {
      return getResult;
    }
    const mediaItem = getResult.value;

    const ensureResult = ensureMediaItemOwnedByViewer(mediaItem.ownerId(), viewerId);
    if (!ensureResult.success) {
      return ensureResult;
    }

    let grantedToHandleResolved: string | undefined;
    if (grantedToHandle) {
      const ensureUser = await ensureUserExists(grantedToHandle, userRepository);
      if (!ensureUser.success) {
        return fail(ensureUser.error);
      }
      grantedToUserId = ensureUser.value.id();
      grantedToHandleResolved = ensureUser.value.handle();
    } else if (grantedToUserId) {
      const found = await userRepository.getById(grantedToUserId);
      grantedToHandleResolved = found?.handle();
    }

    const result = mediaItem.grantShare(
      permission,
      viewerId,
      grantedToUserId,
      token,
      label,
      expiresAt,
    );
    if (!result.success) {
      return result;
    }

    const share = result.value.share;
    const shareId = share.id();

    await database.transaction(async (trx) => {
      await mediaItemRepository.save(mediaItem, { trx });

      await grantRepository.createGrant(
        {
          id: crypto.randomUUID(),
          mediaItemId,
          accessGrantId: shareId,
          grantedToUser: grantedToUserId,
          tokenHash: token ? hashToken(token) : undefined,
          //TODO should be an enum and probably should not be direct_share
          createdAt: new Date(),
        },
        { trx },
      );

      if (grantedToUserId && grantedToHandleResolved) {
        await shareContactRepository.upsertContact(
          viewerId,
          grantedToUserId,
          grantedToHandleResolved,
          { trx },
        );
        const owner = await userRepository.getById(viewerId);
        if (owner) {
          await shareContactRepository.upsertContact(grantedToUserId, viewerId, owner.handle(), {
            trx,
          });
        }
      }
    });

    return ok({ shareId, token, share: toShareProjection(share) });
  };
};
