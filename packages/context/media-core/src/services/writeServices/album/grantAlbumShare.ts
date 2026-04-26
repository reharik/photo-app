import { AlbumMemberRoleEnum, AppErrorCollection } from '@packages/contracts';
import { Knex } from 'knex';
import { ensureUserExists, loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { hashToken } from '../../../application/support/tokenHash';
import { Share } from '../../../domain/Share/Share';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { GrantRepository } from '../../../repositories/domainRepositories/grantRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/shareContactRepository';
import { ShareProjection } from '../../readServices/viewerReadServices/viewerShareReadService';
import { WriteResult } from '../../../types/types';
import { GrantShareResult } from '../mediaItem/writeMediaItem.types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { GrantAlbumShareCommand } from './writeAlbum.types';

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

export interface GrantAlbumShare extends WriteServiceBase {
  (input: GrantAlbumShareCommand): Promise<WriteResult<GrantShareResult>>;
}

type GrantAlbumShareDeps = {
  albumRepository: AlbumRepository;
  userRepository: UserRepository;
  grantRepository: GrantRepository;
  shareContactRepository: ShareContactRepository;
  database: Knex;
};

export const buildGrantAlbumShare = ({
  albumRepository,
  userRepository,
  grantRepository,
  shareContactRepository,
  database,
}: GrantAlbumShareDeps): GrantAlbumShare => {
  return async (input: GrantAlbumShareCommand): Promise<WriteResult<GrantShareResult>> => {
    const { viewerId, albumId, permission, grantedToHandle, token, label, expiresAt } = input;
    let { grantedToUserId } = input;

    const getResult = await loadRequiredAlbum(albumId, albumRepository);
    if (!getResult.success) {
      return getResult;
    }
    const album = getResult.value;

    const ownerMember = album.getAlbumMember(viewerId);
    if (!ownerMember || ownerMember.role() !== AlbumMemberRoleEnum.owner) {
      return fail(AppErrorCollection.album.UserIsNotMember);
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

    const result = album.grantShare(permission, viewerId, grantedToUserId, token, label, expiresAt);
    if (!result.success) {
      return result;
    }

    const share = result.value.share;
    const shareId = share.id();
    const tokenHash = token ? hashToken(token) : undefined;
    const mediaItemIds = album.getMediaItemIds();

    await database.transaction(async (trx) => {
      await albumRepository.save(album, { trx });

      const now = new Date();
      for (const mediaItemId of mediaItemIds) {
        await grantRepository.createGrant(
          {
            id: crypto.randomUUID(),
            mediaItemId,
            accessGrantId: shareId,
            grantedToUser: grantedToUserId,
            tokenHash,
            source: 'album_share',
            sourceId: shareId,
            sourceAlbumId: albumId,
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

    return ok({ shareId, token, share: toShareProjection(share) });
  };
};
