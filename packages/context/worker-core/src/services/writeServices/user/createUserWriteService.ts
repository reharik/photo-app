import { ContractError, fail, ok, OperationResult } from '@packages/contracts';
import { PendingUser } from '../../../domain';
import { UserRepository } from '../../../repositories';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type CreateUserCommand = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type CreateUserResult = { user: PendingUser };

export interface CreateUserWriteService extends WriteServiceBase {
  (input: CreateUserCommand): Promise<OperationResult<CreateUserResult>>;
}

type CreateUserWriteServiceDeps = { userRepository: UserRepository; viewerId: EntityId };

export const build__CreateUserWriteService =
  ({ viewerId, userRepository }: CreateUserWriteServiceDeps): CreateUserWriteService =>
  async ({
    email,
    firstName,
    lastName,
    phone,
  }: CreateUserCommand): Promise<OperationResult<CreateUserResult>> => {
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
      return fail(ContractError.UserAlreadyExists);
    }
    const user = PendingUser.create(
      { email: normalizedEmail, firstName, lastName, phone },
      viewerId,
    );

    await userRepository.save(user);
    return ok({ user });
  };
