import { ContractError, fail, ok, WriteResult } from '@packages/contracts';
import { PendingUser } from '../../../domain';
import { UserRepository } from '../../../repositories';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type CreateUserCommand = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  actorId: EntityId;
};

export type CreateUserResult = { user: PendingUser };

export interface CreateUserWriteService extends WriteServiceBase {
  (input: CreateUserCommand): Promise<WriteResult<CreateUserResult>>;
}

type CreateUserWriteServiceDeps = { userRepository: UserRepository };

export const build__CreateUserWriteService =
  ({ userRepository }: CreateUserWriteServiceDeps): CreateUserWriteService =>
  async ({
    email,
    firstName,
    lastName,
    phone,
    actorId,
  }: CreateUserCommand): Promise<WriteResult<CreateUserResult>> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return fail(ContractError.InvalidEmail);
    }
    if (phone) {
      const phoneRegex = /^\+?[\d\s().-]{7,}$/;
      if (!phoneRegex.test(phone)) {
        return fail(ContractError.InvalidPhoneNumber);
      }
    }
    const existingUser = await userRepository.getUserByEmail(normalizedEmail);
    if (existingUser) {
      fail(ContractError.UserAlreadyExists);
    }
    const user = PendingUser.create({ email, firstName, lastName, phone }, actorId);

    await userRepository.save(user);
    return ok({ user });
  };
