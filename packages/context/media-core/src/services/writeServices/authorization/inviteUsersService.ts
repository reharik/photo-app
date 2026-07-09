import { ContractError } from '@packages/contracts';
import {
  Album,
  AlbumSharedWithNonUser,
  Authorization,
  MediaItem,
  MediaItemsSharedWithUser,
  User,
} from '../../../domain';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import {} from '../mediaItem/writeMediaItem.types';
import {
  GrantAuthorizationInterface,
  GrantUserAuthorizationCommand,
  InviteUsersForMediaItemsResult,
} from './grantTypes';

export const segregateUsers = async (
  grantedToHandles: string[],
  userRepository: UserRepository,
) => {
  const existing: User[] = [];
  const nonExisting: string[] = [];
  for (const handle of grantedToHandles) {
    const user = await userRepository.getByHandle(handle);
    if (user) {
      existing.push(user);
    } else {
      nonExisting.push(handle);
    }
  }
  return { existing, nonExisting };
};

export const inviteNonUsers = (
  nonExisting: string[],
  album: Album,
  input: GrantUserAuthorizationCommand,
  granter: User,
): {
  authorizations: Authorization[];
  serviceEvents: AlbumSharedWithNonUser[];
  publicLinkFailure?: { handles: string[]; error: ContractError }; // branch-level
} => {
  if (nonExisting.length === 0) {
    return { authorizations: [], serviceEvents: [] };
  }
  const linkResult = album.grantPublicLink(input.viewerId, input.expiresAt, input.operations);
  if (!linkResult.success) {
    return {
      authorizations: [],
      serviceEvents: [],
      publicLinkFailure: { handles: nonExisting, error: linkResult.error },
    };
  }
  return {
    authorizations: [linkResult.value.authorization()],
    serviceEvents: nonExisting.map((handle) => ({
      kind: 'albumSharedWithNonUser',
      recipientAddress: handle,
      albumId: album.id(),
      occurredAt: new Date(),
      token: linkResult.value.linkToken(),
      actorId: granter.id(),
    })),
  };
};

export const inviteUsers = (
  existing: User[],
  entity: GrantAuthorizationInterface,
  input: GrantUserAuthorizationCommand,
): {
  authorizations: Authorization[];
  errors: { user: User; error: ContractError }[];
  addedInvitees: User[];
} => {
  const authorizations: Authorization[] = [];
  const errors: { user: User; error: ContractError }[] = [];
  const addedInvitees: User[] = [];

  for (const user of existing) {
    const result = entity.grantAuthorization(
      input.operations,
      input.viewerId,
      user.id(),
      input.label,
      input.expiresAt,
    );
    if (result.success) {
      addedInvitees.push(user);
      authorizations.push(result.value.authorization);
    } else {
      errors.push({ user, error: result.error });
    }
  }
  return { authorizations, errors, addedInvitees };
};

export const inviteUsersForMediaItems = (
  existing: User[],
  mediaItems: MediaItem[],
  input: GrantUserAuthorizationCommand,
): InviteUsersForMediaItemsResult => {
  const grants: { mediaItem: MediaItem; authorization: Authorization }[] = [];
  const errors: { user: User; error: ContractError }[] = [];
  const errorDetail: { user: User; mediaItem: MediaItem; error: ContractError }[] = [];
  const serviceEvents: MediaItemsSharedWithUser[] = [];
  const addedInvitees: User[] = [];

  for (const user of existing) {
    // ← email/invitee axis (outer, once per user)
    let granted = false;
    let firstError: ContractError | undefined;
    const mediaItemIds = [];
    const authorizationIds = [];
    for (const mediaItem of mediaItems) {
      mediaItemIds.push(mediaItem.id());
      // ← authorization axis (inner, N×M)
      const result = mediaItem.grantAuthorization(
        input.operations,
        input.viewerId,
        user.id(),
        input.label,
        input.expiresAt,
      );
      if (result.success) {
        grants.push({ mediaItem, authorization: result.value.authorization });
        authorizationIds.push(result.value.authorization.id());
        granted = true;
      } else {
        errorDetail.push({ user, mediaItem, error: result.error });
        firstError ??= result.error;
      }
    }

    if (granted) {
      addedInvitees.push(user);
      serviceEvents.push({
        kind: 'mediaItemsSharedWithUser',
        userId: user.id(),
        mediaItemIds,
        occurredAt: new Date(),
        actorId: input.viewerId,
        authorizationIds,
      });
    } else if (firstError) {
      errors.push({ user, error: firstError }); // zero successes → surfaced; partial → log only
    }
  }

  return { grants, errors, errorDetail, serviceEvents, addedInvitees };
};
