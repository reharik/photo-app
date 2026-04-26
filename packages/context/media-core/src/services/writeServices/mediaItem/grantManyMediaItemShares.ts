import { AppErrorCollection } from '@packages/contracts';
import { Knex } from 'knex';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import {
  ensureUserExists,
  loadRequiredMediaItem,
} from '../../../application/support/resourceLoaders';
import { hashToken } from '../../../application/support/tokenHash';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { Share } from '../../../domain/Share/Share';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { GrantRepository } from '../../../repositories/domainRepositories/grantRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/shareContactRepository';
import { EntityId, WriteResult } from '../../../types/types';
import { ShareProjection } from '../../readServices/viewerReadServices/viewerShareReadService';
import { WriteServiceBase } from '../writeServiceBaseType';
import {
  GrantManyMediaItemSharesCommand,
  GrantManyMediaItemSharesResult,
} from './writeMediaItem.types';

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

const dedupePreserveOrder = (ids: EntityId[]): EntityId[] => {
  const seen = new Set<EntityId>();
  const out: EntityId[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(id);
  }
  return out;
};

export interface GrantManyMediaItemShares extends WriteServiceBase {
  (input: GrantManyMediaItemSharesCommand): Promise<WriteResult<GrantManyMediaItemSharesResult>>;
}

type GrantManyMediaItemSharesDeps = {
  mediaItemRepository: MediaItemRepository;
  userRepository: UserRepository;
  grantRepository: GrantRepository;
  shareContactRepository: ShareContactRepository;
  database: Knex;
};

/**
 * Grants the same share (single recipient OR single token) across many media items
 * in one database transaction. Any failure rolls back every grant in the batch.
 */
export const buildGrantManyMediaItemShares = ({
  mediaItemRepository,
  userRepository,
  grantRepository,
  shareContactRepository,
  database,
}: GrantManyMediaItemSharesDeps): GrantManyMediaItemShares => {
  return async (
    input: GrantManyMediaItemSharesCommand,
  ): Promise<WriteResult<GrantManyMediaItemSharesResult>> => {
    const { viewerId, permission, grantedToHandle, label, expiresAt } = input;
    const dedupedIds = dedupePreserveOrder(input.mediaItemIds);

    if (dedupedIds.length === 0) {
      return fail(AppErrorCollection.mediaItem.DeleteMediaItemsEmptyList);
    }

    let { grantedToUserId } = input;
    let token: string | undefined;
    let grantedToHandleResolved: string | undefined;
    if (grantedToHandle) {
      const ensureUser = await ensureUserExists(grantedToHandle, userRepository);
      if (!ensureUser.success) {
        // TOOD don't return this here. it says the user does not exist.
        return fail(ensureUser.error);
      }
      grantedToUserId = ensureUser.value.id();
      grantedToHandleResolved = ensureUser.value.handle();
    } else if (grantedToUserId) {
      const found = await userRepository.getById(grantedToUserId);
      grantedToHandleResolved = found?.handle();
    } else {
      // if neither grantedToHandle nor grantedToUserId are provided,
      // it means it is a public share.
      token = crypto.randomUUID();
    }

    const mediaItems: MediaItem[] = [];
    for (const id of dedupedIds) {
      const loaded = await loadRequiredMediaItem(id, mediaItemRepository);
      if (!loaded.success) {
        return loaded;
      }
      const ownership = ensureMediaItemOwnedByViewer(loaded.value.ownerId(), viewerId);
      if (!ownership.success) {
        return ownership;
      }
      mediaItems.push(loaded.value);
    }

    const grants: { mediaItem: MediaItem; share: Share }[] = [];
    for (const mediaItem of mediaItems) {
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
      grants.push({ mediaItem, share: result.value.share });
    }

    const owner =
      grantedToUserId && grantedToHandleResolved
        ? await userRepository.getById(viewerId)
        : undefined;

    await database.transaction(async (trx) => {
      for (const { mediaItem, share } of grants) {
        await mediaItemRepository.save(mediaItem, { trx });

        await grantRepository.createGrant(
          {
            id: crypto.randomUUID(),
            mediaItemId: mediaItem.id(),
            accessGrantId: share.id(),
            grantedToUser: grantedToUserId,
            tokenHash: token ? hashToken(token) : undefined,
            createdAt: new Date(),
          },
          { trx },
        );
      }

      // This check means we determined the user exists.
      if (grantedToUserId && grantedToHandleResolved) {
        await shareContactRepository.upsertContact(
          viewerId,
          grantedToUserId,
          grantedToHandleResolved,
          { trx },
        );
        if (owner) {
          await shareContactRepository.upsertContact(grantedToUserId, viewerId, owner.handle(), {
            trx,
          });
        }
      }
    });

    return ok({
      shareIds: grants.map((g) => g.share.id()),
      shares: grants.map((g) => toShareProjection(g.share)),
      token,
    });
  };
};
