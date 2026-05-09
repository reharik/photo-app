import { ViewerOperation } from '@packages/contracts';
import { Knex } from 'knex';
import { ensureUserExists, loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { Authorization } from '../../../domain/Authorization/Authorization';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { GrantRepository } from '../../../repositories/domainRepositories/grantRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/shareContactRepository';
import { WriteResult } from '../../../types/types';
import { AuthorizationProjection } from '../../readServices/types';
import { GrantUserAuthorizationForAlbumCommand } from '../album/writeAlbum.types';
import { GrantUserAuthorizationResult } from '../mediaItem/writeMediaItem.types';
import { WriteServiceBase } from '../writeServiceBaseType';

const toAuthorizationProjection = (authorization: Authorization): AuthorizationProjection => ({
  id: authorization.id(),
  grantedToUserId: authorization.grantedToUser(),
  permission: authorization.permission(),
  label: authorization.label(),
  expiresAt: authorization.expiresAt(),
  revokedAt: authorization.revokedAt(),
  // Authorization was just created in this transaction;
  createdAt: new Date(),
});

export interface GrantUserAuthorizationForAlbum extends WriteServiceBase {
  (
    input: GrantUserAuthorizationForAlbumCommand,
  ): Promise<WriteResult<GrantUserAuthorizationResult>>;
}

type GrantUserAuthorizationForAlbumDeps = {
  albumRepository: AlbumRepository;
  userRepository: UserRepository;
  grantRepository: GrantRepository;
  shareContactRepository: ShareContactRepository;
  database: Knex;
};

export const build__GrantUserAuthorizationForAlbum = ({
  albumRepository,
  userRepository,
  grantRepository,
  shareContactRepository,
  database,
}: GrantUserAuthorizationForAlbumDeps): GrantUserAuthorizationForAlbum => {
  return async (
    input: GrantUserAuthorizationForAlbumCommand,
  ): Promise<WriteResult<GrantUserAuthorizationResult>> => {
    const { viewerId, albumId, permission, grantedToHandle, label, expiresAt } = input;
    let { grantedToUserId } = input;

    const getResult = await loadRequiredAlbum(albumId, albumRepository);
    if (!getResult.success) {
      return getResult;
    }
    const album = getResult.value;

    const member = album.getAlbumMember(viewerId);
    if (!member || !member.role().can(ViewerOperation.grantAuthorization)) {
      return fail(ViewerOperation.grantAuthorization.deniedError);
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

    const result = album.grantAuthorization(
      permission,
      viewerId,
      grantedToUserId,
      label,
      expiresAt,
    );
    if (!result.success) {
      return result;
    }

    const authorization = result.value.authorization;
    const authorizationId = authorization.id();
    const mediaItemIds = album.getMediaItemIds();

    await database.transaction(async (trx) => {
      await albumRepository.save(album, viewerId, { trx });

      const now = new Date();
      for (const mediaItemId of mediaItemIds) {
        await grantRepository.createGrant(
          {
            id: crypto.randomUUID(),
            mediaItemId,
            accessGrantId: authorizationId,
            grantedToUser: grantedToUserId,
            createdAt: now,
          },
          { trx },
        );
      }

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

    return ok({
      authorizationIds: [authorizationId],
      authorizations: [toAuthorizationProjection(authorization)],
    });
  };
};
