import {
  AppErrorCollection,
  ContractError,
  fail,
  ok,
  Operation,
  WriteResult,
} from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { PendingUser, PublicLinkSharedWithUser, User } from '../../../domain';
import { UnitOfWork } from '../../../infrastructure';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { ShareContactRepository } from '../../../repositories/domainRepositories/shareContactRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { CreateUserWriteService } from '../user/createUserWriteService';
import { WriteServiceBase } from '../writeServiceBaseType';
import { GrantUserAuthorizationCommand, GrantUserAuthorizationResult } from './grantTypes';
import {
  getOrCreateAllUsers,
  invitePendingUsers,
  inviteUsers,
  saveNewShareContacts,
} from './inviteUsersService';

export interface GrantUserAuthorizationForAlbum extends WriteServiceBase {
  (input: GrantUserAuthorizationCommand): Promise<WriteResult<GrantUserAuthorizationResult>>;
}

type GrantUserAuthorizationForAlbumDeps = {
  albumRepository: AlbumRepository;
  userRepository: UserRepository;
  shareContactRepository: ShareContactRepository;
  createUserWriteService: CreateUserWriteService;
  logger: Logger;
  uow: UnitOfWork;
};

export const build__GrantUserAuthorizationForAlbum = ({
  albumRepository,
  userRepository,
  shareContactRepository,
  createUserWriteService,
  logger,
  uow,
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
    const userResult = await getOrCreateAllUsers(
      grantedToHandles,
      userRepository,
      createUserWriteService,
      viewerId,
    );
    if (!userResult.success) {
      return userResult;
    }
    const activeUsers = userResult.value.filter((u): u is User => u.kind === 'active');
    const pendingUsers = userResult.value.filter((u): u is PendingUser => u.kind === 'pending');

    // active → album.grantAuthorization emits its own domain events
    const activeResult = inviteUsers(activeUsers, album, input);

    // pending → public link + serviceEvents (no domain events)
    const pendingResult = invitePendingUsers(pendingUsers, album, input, logger);
    let pendingUserServiceEvents: PublicLinkSharedWithUser[] = [];
    if (!pendingResult.success) {
      logger.warn('PendingUser album invite failed', {
        failures: pendingUsers.map((d) => ({
          userId: d.id(),
          albumId: album.id(),
          error: pendingResult.error,
        })),
      });
    } else {
      pendingUserServiceEvents = pendingResult.value;
    }

    // ALL-OR-NOTHING GUARD — mirror the mediaItem path. Until the share UI renders the
    // errors array, a partial active-grant failure is a silent "shared!" lie, so fail the
    // whole op (rolls back uow). Pending failures stay non-fatal (logged above). See RAI-XX.
    if (activeResult.errors.length > 0) {
      logger.warn('partial album grant', {
        failures: activeResult.errors.map((d) => ({
          userId: d.user.id(),
          albumId: album.id(),
          code: d.error.code,
        })),
      });
      return fail(ContractError.PartialShareFailure);
    }

    // only persist contacts for people who actually got a grant
    const invitedUsers = [
      ...activeResult.invitedUsers,
      ...(pendingResult.success ? pendingUsers : []),
    ];
    await saveNewShareContacts(invitedUsers, granter, shareContactRepository);

    await albumRepository.save(album);
    uow.collectEvents(pendingUserServiceEvents);

    return ok({ invitedUsers, errors: activeResult.errors });
  };
};
