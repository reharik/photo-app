import { AppErrorCollection, fail, ok, Operation, WriteResult } from '@packages/contracts';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { UnitOfWork } from '../../../infrastructure';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { ShareContactRepository } from '../../../repositories/domainRepositories/shareContactRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
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
  uow: UnitOfWork;
};

export const build__GrantUserAuthorizationForAlbum = ({
  albumRepository,
  userRepository,
  shareContactRepository,
  uow,
}: GrantUserAuthorizationForAlbumDeps): GrantUserAuthorizationForAlbum => {
  return async (
    input: GrantUserAuthorizationCommand,
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
    const nonExistingResult = inviteNonUsers(nonExisting, album, input, granter);
    const existingResult = inviteUsers(existing, album, input); //, album.title(), granter);

    // getPendingAndActiveUsers
    // createPendingUsers -- where they don't exist
    // invite all of them
    // for each pending user

    const result = {
      authorizations: [...nonExistingResult.authorizations, ...existingResult.authorizations],
      errors: existingResult.errors,
      publicLinkFailure: nonExistingResult.publicLinkFailure,
    };
    // we don't want to return without saving if only publicLinkFailure
    if (result.errors.length > 0) {
      return ok(result);
    }
    uow.collectEvents(nonExistingResult.serviceEvents);
    await albumRepository.save(album);
    await Promise.all([
      ...existingResult.addedInvitees.flatMap((invitee) => [
        shareContactRepository.upsertContact(invitee.handle(), viewerId, invitee.id()),
        shareContactRepository.upsertContact(granter.handle(), invitee.id(), viewerId),
      ]),
      ...nonExistingResult.serviceEvents.map((event) =>
        shareContactRepository.upsertContact(event.recipientAddress, viewerId),
      ),
    ]);
    return ok(result);
  };
};
