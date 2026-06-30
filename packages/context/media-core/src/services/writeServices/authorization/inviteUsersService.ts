import { ContractError } from '@packages/contracts';
import { Authorization, MediaItem, User } from '../../../domain';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import {} from '../mediaItem/writeMediaItem.types';
import {
  GrantAuthorizationInterface,
  GrantEmailDTO,
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
  entity: GrantAuthorizationInterface,
  input: GrantUserAuthorizationCommand,
  title: string,
  granter: User,
): {
  authorizations: Authorization[];
  emailDTOs: GrantEmailDTO[];
  publicLinkFailure?: { handles: string[]; error: ContractError }; // branch-level
} => {
  if (nonExisting.length === 0) {
    return { authorizations: [], emailDTOs: [] };
  }
  const linkResult = entity.grantPublicLink(input.viewerId, input.expiresAt, input.operations);
  if (!linkResult.success) {
    return {
      authorizations: [],
      emailDTOs: [],
      publicLinkFailure: { handles: nonExisting, error: linkResult.error },
    };
  }
  return {
    authorizations: [linkResult.value.authorization()],
    emailDTOs: nonExisting.map((handle) => ({
      template: 'publicShare',
      inviteeEmail: handle,
      inviterName: granter.fullName(),
      title: title,
      tokenOrUserId: linkResult.value.linkToken(),
      isPublicLink: true,
    })),
  };
};

export const inviteUsers = (
  existing: User[],
  entity: GrantAuthorizationInterface,
  input: GrantUserAuthorizationCommand,
  // title: string,
  // granter: User,
): {
  authorizations: Authorization[];
  // emailDTOs: GrantEmailDTO[];
  errors: { user: User; error: ContractError }[];
  addedInvitees: User[];
} => {
  const authorizations: Authorization[] = [];
  // const emailDTOs: GrantEmailDTO[] = [];
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

      // The grantAuthorizatoin should fire an domain event for the email
      // emailDTOs.push({
      //   inviteeEmail: user.email(),
      //   inviterName: granter.fullName(),
      //   title,
      //   tokenOrUserId: entity.id(),
      // });
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
  // granter: User,
): InviteUsersForMediaItemsResult => {
  const grants: { mediaItem: MediaItem; authorization: Authorization }[] = [];
  const errors: { user: User; error: ContractError }[] = [];
  const errorDetail: { user: User; mediaItem: MediaItem; error: ContractError }[] = [];
  const addedInvitees: User[] = [];

  for (const user of existing) {
    // ← email/invitee axis (outer, once per user)
    let granted = false;
    let firstError: ContractError | undefined;

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
        grants.push({ mediaItem, authorization: result.value.authorization });
        granted = true;
      } else {
        errorDetail.push({ user, mediaItem, error: result.error });
        firstError ??= result.error;
      }
    }

    if (granted) {
      addedInvitees.push(user);
      // emailDTOs.push({
      //   inviteeEmail: user.email(),
      //   inviterName: granter.fullName(),
      //   title: input.label ?? '',
      // });
    } else if (firstError) {
      errors.push({ user, error: firstError }); // zero successes → surfaced; partial → log only
    }
  }

  return { grants, errors, errorDetail, addedInvitees };
};
