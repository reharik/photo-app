import { ContractError, fail, ok, WriteResult } from '@packages/contracts';
import { indexBy } from '@packages/infrastructure';
import { Album, AlbumAuthorizationInput, PendingUser, User } from '../../../domain';
import { ShareContactRepository } from '../../../repositories';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { EntityId } from '../../../types';
import { CreateUserWriteService } from '../user/createUserWriteService';
import { GrantUserAuthorizationCommand } from './grantTypes';

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
    const payload: AlbumAuthorizationInput = {
      operations: input.operations,
      actorId: input.viewerId,
      label: input.label,
      expiresAt: input.expiresAt,
      grantedToUserId: user.id(),
    };
    let authResult;
    if (user.kind === 'active') {
      authResult = album.grantAuthorization(payload);
    } else {
      authResult = album.grantPendingUserAuthorization(payload);
    }

    if (authResult.success) {
      invitedUsers.push(user);
    } else {
      errors.push({ user, error: authResult.error });
    }
  }
  return { errors, invitedUsers };
};
