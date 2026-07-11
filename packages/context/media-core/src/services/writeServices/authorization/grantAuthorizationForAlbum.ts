import { AppErrorCollection, fail, ok, Operation, WriteResult } from '@packages/contracts';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { UnitOfWork } from '../../../infrastructure';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { ShareContactRepository } from '../../../repositories/domainRepositories/shareContactRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { WriteServiceBase } from '../writeServiceBaseType';
import { GrantUserAuthorizationCommand, GrantUserAuthorizationResult } from './grantTypes';
import { getOrCreateAllUsers, inviteUsers, saveNewShareContacts } from './inviteUsersService';

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
}: GrantUserAuthorizationForAlbumDeps): GrantUserAuthorizationForAlbum => {
  return async (
    input: GrantUserAuthorizationCommand,
  ): Promise<WriteResult<GrantUserAuthorizationResult>> => {
    // setup and validation
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

    // invitations
    const users = await getOrCreateAllUsers(grantedToHandles, userRepository, viewerId);
    const invitedUserResults = inviteUsers(users, album, input); //, album.title(), granter);
    await saveNewShareContacts(invitedUserResults.invitedUsers, granter, shareContactRepository);
    await albumRepository.save(album);

    return ok(invitedUserResults);
  };
};
