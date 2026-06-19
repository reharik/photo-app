import { AppErrorCollection, fail, ok, Operation, WriteResult } from '@packages/contracts';
import { Knex } from 'knex';
import { ensureUserExists, loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/types';
import { GrantUserAuthorizationForAlbumCommand } from '../album/writeAlbum.types';
import { GrantUserAuthorizationResult } from '../mediaItem/writeMediaItem.types';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface GrantUserAuthorizationForAlbum extends WriteServiceBase {
  (
    input: GrantUserAuthorizationForAlbumCommand,
  ): Promise<WriteResult<GrantUserAuthorizationResult>>;
}

type GrantUserAuthorizationForAlbumDeps = {
  albumRepository: AlbumRepository;
  userRepository: UserRepository;
  shareContactRepository: ShareContactRepository;
  runInTransaction: RunInTransaction;
};

export const build__GrantUserAuthorizationForAlbum = ({
  albumRepository,
  userRepository,
  shareContactRepository,
  runInTransaction,
}: GrantUserAuthorizationForAlbumDeps): GrantUserAuthorizationForAlbum => {
  return async (
    input: GrantUserAuthorizationForAlbumCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<GrantUserAuthorizationResult>> => {
    const { viewerId, albumId, operations, grantedToHandle, label, expiresAt } = input;

    const getResult = await loadRequiredAlbum(albumId, albumRepository);
    if (!getResult.success) {
      return getResult;
    }
    const album = getResult.value;

    const member = album.getAlbumMember(viewerId);
    if (!member || !member.role().can(Operation.grantAlbumAuthorization)) {
      return fail(Operation.grantAlbumAuthorization.deniedError);
    }
    const granter = await userRepository.getById(viewerId);
    if (!granter) {
      return fail(AppErrorCollection.user.UserNotFound);
    }
    const ensureUser = await ensureUserExists(grantedToHandle, userRepository);
    if (!ensureUser.success) {
      const publicLinkResult = album.grantPublicLink(input.viewerId, input.expiresAt);
      if (!publicLinkResult.success) {
        return publicLinkResult;
      }
      const publicLink = publicLinkResult.value;
      await runInTransaction(trx, async (db) => {
        await albumRepository.save(album, db);
      });

      return ok({
        authorizationIds: [publicLink.id()],
        inviteeEmail: grantedToHandle,
        inviterName: granter?.fullName(),
        albumTitle: album.title(),
        tokenOrUserId: publicLink.linkToken(),
        isPublicLink: true,
      });
    }

    const invitee = ensureUser.value;
    const grantResult = album.grantAuthorization(
      operations,
      viewerId,
      invitee.id(),
      label,
      expiresAt,
    );
    if (!grantResult.success) {
      return grantResult;
    }

    await runInTransaction(trx, async (db) => {
      await albumRepository.save(album, db);
      await shareContactRepository.upsertContact(viewerId, invitee.id(), invitee.handle(), db);
      await shareContactRepository.upsertContact(invitee.id(), viewerId, granter.handle(), db);
    });

    const authorizationId = grantResult.value.authorization.id();
    return ok({
      authorizationIds: [authorizationId],
      inviteeEmail: grantedToHandle,
      inviterName: granter?.fullName(),
      albumTitle: album.title(),
      tokenOrUserId: album.id(),
    });
  };
};
