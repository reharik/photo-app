import { AppErrorCollection, fail, ok, Operation, WriteResult } from '@packages/contracts';
import { Knex } from 'knex';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { GrantUserAuthorizationCommand, GrantUserAuthorizationResult } from './grantTypes';
import { inviteNonUsers, inviteUsers, segregateUsers } from './inviteUsersService';

export interface GrantUserAuthorizationForAlbum extends WriteServiceBase {
  (input: GrantUserAuthorizationCommand): Promise<WriteResult<GrantUserAuthorizationResult>>;
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
    input: GrantUserAuthorizationCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<GrantUserAuthorizationResult>> => {
    const { viewerId, entityIds, grantedToHandles } = input;
    const albumId = entityIds[0];
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
    const { existing, nonExisting } = await segregateUsers(grantedToHandles, userRepository);
    const nonExistingResult = inviteNonUsers(nonExisting, album, input, album.title(), granter);
    const existingResult = inviteUsers(existing, album, input, album.title(), granter);

    const result = {
      authorizations: [...nonExistingResult.authorizations, ...existingResult.authorizations],
      emailDTOs: [...nonExistingResult.emailDTOs, ...existingResult.emailDTOs],
      errors: existingResult.errors,
      publicLinkFailure: nonExistingResult.publicLinkFailure,
    };

    if (!result.emailDTOs.length) {
      return ok(result);
    }

    await runInTransaction(trx, async (db) => {
      await albumRepository.save(album, db);
      await Promise.all(
        existingResult.addedInvitees.flatMap((invitee) => [
          shareContactRepository.upsertContact(viewerId, invitee.id(), invitee.handle(), db),
          shareContactRepository.upsertContact(invitee.id(), viewerId, granter.handle(), db),
        ]),
      );
    });
    console.log(`************result************`);
    console.log(result);
    console.log(`********END result************`);
    return ok(result);
  };
};
