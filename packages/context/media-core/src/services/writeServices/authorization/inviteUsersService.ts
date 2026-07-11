import { ContractError, notEmpty } from '@packages/contracts';
import { Album, MediaItem, MediaItemsSharedWithUser, PendingUser, User } from '../../../domain';
import { UserAuthorization } from '../../../domain/Authorization/UserAuthorization';
import { ShareContactRepository } from '../../../repositories';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { EntityId } from '../../../types';
import {} from '../mediaItem/writeMediaItem.types';
import { GrantUserAuthorizationCommand, InviteUsersForMediaItemsResult } from './grantTypes';

export const getOrCreateAllUsers = async (
  grantedToHandles: string[],
  userRepository: UserRepository,
  actorId: EntityId,
) => {
  const users = await userRepository.getPendingAndActiveUsersByHandle(grantedToHandles);

  const foundHandles = new Set(users.map((u) => u.email())); // whatever the handle field is
  const newPendingUsers = grantedToHandles
    .filter((h) => !foundHandles.has(h))
    .map((x) => PendingUser.create({ email: x, firstName: '', lastName: '' }, actorId));
  await Promise.all(newPendingUsers.map((x) => userRepository.save(x)));
  return [...users, ...newPendingUsers];
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

export const inviteUsersForMediaItems = (
  existing: User[],
  mediaItems: MediaItem[],
  input: GrantUserAuthorizationCommand,
): InviteUsersForMediaItemsResult => {
  const errors: { user: User; error: ContractError }[] = [];
  const errorDetail: { user: User; mediaItem: MediaItem; error: ContractError }[] = [];
  const serviceEvents: MediaItemsSharedWithUser[] = [];
  const authorizations: UserAuthorization[] = [];

  for (const user of existing) {
    // ← email/invitee axis (outer, once per user)
    const userAuthz: UserAuthorization[] = [];
    const userErrors = [];
    for (const mediaItem of mediaItems) {
      // ← authorization axis (inner, N×M)
      const result = mediaItem.grantAuthorization(
        input.operations,
        input.viewerId,
        user.id(),
        input.label,
        input.expiresAt,
      );
      if (result.success) {
        // grants.push({ mediaItem, authorization: result.value.authorization });
        userAuthz.push(result.value.authorization);
      } else {
        userErrors.push({ user, mediaItem, error: result.error });
      }
    }

    if (userAuthz.length > 0) {
      authorizations.push(...userAuthz);
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
      errors.push({ user, error: userErrors[0].error }); // zero successes → surfaced; partial → log only
      errorDetail.push(...userErrors);
    }
  }

  return { errors, errorDetail, serviceEvents, authorizations };
};
