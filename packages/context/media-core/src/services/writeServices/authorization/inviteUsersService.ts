import { ContractError, fail, notEmpty, ok, WriteResult } from '@packages/contracts';
import { indexBy, Logger } from '@packages/infrastructure';
import {
  Album,
  MediaItem,
  MediaItemsSharedWithUser,
  PendingUser,
  PublicLinkSharedWithUser,
  User,
} from '../../../domain';
import { UserAuthorization } from '../../../domain/Authorization/UserAuthorization';
import { ShareContactRepository } from '../../../repositories';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { EntityId } from '../../../types';
import {} from '../mediaItem/writeMediaItem.types';
import { CreateUserWriteService } from '../user/createUserWriteService';
import { GrantUserAuthorizationCommand, InviteUsersForMediaItemsResult } from './grantTypes';

export const getOrCreateAllUsers = async (
  grantedToHandles: string[],
  userRepository: UserRepository,
  createUserWriteService: CreateUserWriteService,
  actorId: EntityId,
): Promise<WriteResult<(User | PendingUser)[]>> => {
  const normalizedEmails = [...new Set(grantedToHandles.map((x) => x.trim().toLowerCase()))];
  const users = await userRepository.getAllUsersByEmail(normalizedEmails);
  const userMap = indexBy(users, (x) => x.email().trim().toLowerCase());
  const nonUsers = normalizedEmails.filter((x) => !userMap.has(x));

  const newUserPromises = nonUsers.map((x) =>
    createUserWriteService({ email: x, firstName: '', lastName: '', actorId }),
  );
  const result = await Promise.all(newUserPromises);
  const failure = result.find((x) => !x.success);
  if (failure && !failure.success) {
    // narrows to the fail variant
    return fail(failure.error);
  }
  const newPendingUsers = result.flatMap((x) => (x.success ? [x.value.user] : []));
  return ok([...users, ...newPendingUsers]);
};

export const saveNewShareContacts = async (
  users: (User | PendingUser)[],
  granter: User,
  shareContactRepository: ShareContactRepository,
) => {
  const newShareContactPromises = users.flatMap((invitee) => [
    shareContactRepository.upsertContact(invitee.email(), granter.id(), invitee.id()),
    shareContactRepository.upsertContact(granter.handle(), invitee.id(), granter.id()),
  ]);
  await Promise.all(newShareContactPromises);
};

export const inviteUsers = (
  users: (User | PendingUser)[],
  album: Album,
  input: GrantUserAuthorizationCommand,
): {
  errors: { user: User | PendingUser; error: ContractError }[];
  invitedUsers: (User | PendingUser)[];
} => {
  const errors: { user: User | PendingUser; error: ContractError }[] = [];
  const invitedUsers: (User | PendingUser)[] = [];

  for (const user of users) {
    const result = album.grantAuthorization(
      input.operations,
      input.viewerId,
      user.id(),
      input.label,
      input.expiresAt,
    );
    if (result.success) {
      invitedUsers.push(user);
    } else {
      errors.push({ user, error: result.error });
    }
  }
  return { errors, invitedUsers };
};

export const invitePendingUsers = (
  users: PendingUser[],
  album: Album,
  input: GrantUserAuthorizationCommand,
  logger: Logger,
): WriteResult<PublicLinkSharedWithUser[]> => {
  const serviceEvents: PublicLinkSharedWithUser[] = [];
  const result = album.grantPublicLink(input.viewerId, input.expiresAt, input.operations);
  if (!result.success) {
    return fail(result.error);
  }

  const publicLinkAuthorization = result.value;
  for (const user of users) {
    serviceEvents.push({
      kind: 'publicLinkSharedWithUser',
      userId: user.id(),
      publicLinkAuthorizationId: publicLinkAuthorization.id(),
      occurredAt: new Date(),
      actorId: input.viewerId,
    });
  }

  logger.debug(`Pending User service events recorded: ${JSON.stringify(serviceEvents, null, 4)}`);
  return ok(serviceEvents);
};

export const inviteUsersForMediaItems = (
  users: (PendingUser | User)[],
  mediaItems: MediaItem[],
  input: GrantUserAuthorizationCommand,
  logger: Logger,
): InviteUsersForMediaItemsResult => {
  const errors: { user: PendingUser | User; error: ContractError }[] = [];
  const errorDetail: { user: PendingUser | User; mediaItem: MediaItem; error: ContractError }[] =
    [];
  const serviceEvents: MediaItemsSharedWithUser[] = [];
  const authorizations: UserAuthorization[] = [];

  for (const user of users) {
    const userAuthz: UserAuthorization[] = [];
    const userErrors: typeof errorDetail = [];

    for (const mediaItem of mediaItems) {
      const result = mediaItem.grantAuthorization(
        input.operations,
        input.viewerId,
        user.id(),
        input.label,
        input.expiresAt,
      );
      if (result.success) {
        userAuthz.push(result.value.authorization); // ← was pushing to global `authorizations`
      } else {
        userErrors.push({ user, mediaItem, error: result.error });
      }
    }

    authorizations.push(...userAuthz); // feed the global list once, per user

    if (user.kind === 'active' && userAuthz.length > 0) {
      serviceEvents.push({
        kind: 'mediaItemsSharedWithUser',
        userId: user.id(),
        mediaItemIds: userAuthz.map((x) => x.mediaItemId()).filter(notEmpty),
        occurredAt: new Date(),
        actorId: input.viewerId,
        authorizationIds: userAuthz.map((x) => x.id()),
      });
    }

    if (userErrors.length > 0) {
      errors.push({ user, error: userErrors[0].error });
      errorDetail.push(...userErrors);
    }
  }

  logger.debug(`Service events recorded: ${JSON.stringify(serviceEvents, null, 4)}`);
  return { errors, errorDetail, serviceEvents, authorizations };
};
