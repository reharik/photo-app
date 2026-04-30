import { AppErrorCollection } from '@packages/contracts';
import { Knex } from 'knex';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import {
  ensureUserExists,
  loadRequiredMediaItem,
} from '../../../application/support/resourceLoaders';
import { Authorization } from '../../../domain/Authorization/Authorization';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { GrantRepository } from '../../../repositories/domainRepositories/grantRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/shareContactRepository';
import { EntityId, WriteResult } from '../../../types/types';
import { AuthorizationProjection } from '../../readServices/viewerReadServices/viewerAuthorizationReadService';
import {
  GrantUserAuthorizationForMediaItemsCommand,
  GrantUserAuthorizationResult,
} from '../mediaItem/writeMediaItem.types';
import { WriteServiceBase } from '../writeServiceBaseType';

const toAuthorizationProjection = (authorization: Authorization): AuthorizationProjection => ({
  id: authorization.id(),
  grantedToUserId: authorization.grantedToUser(),
  permission: authorization.permission().value,
  label: authorization.label(),
  expiresAt: authorization.expiresAt(),
  revokedAt: authorization.revokedAt(),
  // Authorization was just created in this transaction; accurate within milliseconds.
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

export interface GrantAuthorizationForMediaItems extends WriteServiceBase {
  (
    input: GrantUserAuthorizationForMediaItemsCommand,
  ): Promise<WriteResult<GrantUserAuthorizationResult>>;
}

type GrantAuthorizationForMediaItemsDeps = {
  mediaItemRepository: MediaItemRepository;
  userRepository: UserRepository;
  grantRepository: GrantRepository;
  shareContactRepository: ShareContactRepository;
  database: Knex;
};

/**
 * Grants the same authorization (single recipient OR single token) across many media items
 * in one database transaction. Any failure rolls back every grant in the batch.
 */
export const buildGrantAuthorizationForMediaItems = ({
  mediaItemRepository,
  userRepository,
  grantRepository,
  shareContactRepository,
  database,
}: GrantAuthorizationForMediaItemsDeps): GrantAuthorizationForMediaItems => {
  return async (
    input: GrantUserAuthorizationForMediaItemsCommand,
  ): Promise<WriteResult<GrantUserAuthorizationResult>> => {
    const { viewerId, permission, grantedToHandle, label, expiresAt } = input;
    const dedupedIds = dedupePreserveOrder(input.mediaItemIds);

    if (dedupedIds.length === 0) {
      return fail(AppErrorCollection.mediaItem.DeleteMediaItemsEmptyList);
    }

    let { grantedToUserId } = input;
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

    const grants: { mediaItem: MediaItem; authorization: Authorization }[] = [];
    for (const mediaItem of mediaItems) {
      const result = mediaItem.grantAuthorization(
        permission,
        viewerId,
        grantedToUserId,
        label,
        expiresAt,
      );
      if (!result.success) {
        return result;
      }
      grants.push({ mediaItem, authorization: result.value.authorization });
    }

    const owner =
      grantedToUserId && grantedToHandleResolved
        ? await userRepository.getById(viewerId)
        : undefined;

    await database.transaction(async (trx) => {
      for (const { mediaItem, authorization } of grants) {
        await mediaItemRepository.save(mediaItem, { trx });

        await grantRepository.createGrant(
          {
            id: crypto.randomUUID(),
            mediaItemId: mediaItem.id(),
            accessGrantId: authorization.id(),
            grantedToUser: grantedToUserId,
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
      authorizationIds: grants.map((g) => g.authorization.id()),
      authorizations: grants.map((g) => toAuthorizationProjection(g.authorization)),
    });
  };
};
