import { fail, ok, OperationResult } from '@packages/contracts';
import { indexBy } from '@packages/infrastructure';
import {
  Album,
  AlbumAuthorizationInput,
  PendingUser,
  PendingUserAuthorization,
  User,
  UserAuthorization,
} from '../../../domain';
import {
  eachIndependently,
  IndependentGroupResult,
} from '../../../infrastructure/writeServices/groupActionStrategy';
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
): Promise<OperationResult<(User | PendingUser)[]>> => {
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

export type GrantedAuthorization = { authorization: UserAuthorization | PendingUserAuthorization };
export const inviteUsers = (
  users: (User | PendingUser)[],
  album: Album,
  input: GrantUserAuthorizationCommand,
): IndependentGroupResult<User | PendingUser, GrantedAuthorization> => {
  return eachIndependently(users, (user) => {
    const payload: AlbumAuthorizationInput = {
      actorId: input.viewerId,
      label: input.label,
      grantedToUserId: user.id(),
    };
    const result: OperationResult<GrantedAuthorization> =
      user.kind === 'active'
        ? album.grantAuthorization(payload)
        : album.grantPendingUserAuthorization(payload);
    return result;
  });
};
