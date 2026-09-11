import {
  assertNever,
  ContractError,
  EntityId,
  fail,
  ok,
  OperationResult,
  type SignupInput,
} from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import {
  ActivatePendingUserWriteService,
  EmailVerificationRepository,
  PendingUser,
  RequestScopeLifeCycle,
  SystemEmailVerificationRepository,
  UserRepository,
} from '@packages/media-core';
import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';

export interface AuthService extends RequestScopeLifeCycle {
  verifyCodeAndSetPassword: (
    credentials: SignupInput,
  ) => Promise<OperationResult<{ userId: EntityId; template: 'welcome' | 'passwordChanged' }>>;
}

type AuthServiceDeps = {
  logger: Logger;
  userRepository: UserRepository;
  emailVerificationRepository: EmailVerificationRepository;
  systemEmailVerificationRepository: SystemEmailVerificationRepository;
  activatePendingUserWriteService: ActivatePendingUserWriteService;
};

export const build__AuthService = ({
  logger,
  userRepository,
  emailVerificationRepository,
  systemEmailVerificationRepository,
  activatePendingUserWriteService,
}: AuthServiceDeps): AuthService => {
  const verifyCode = async (
    email: string,
    code: string,
  ): Promise<OperationResult<{ id: string }>> => {
    const verificationRow = await emailVerificationRepository.getValidVerification(email);

    // create hash first so we have a similar timeline between the different
    // failure cases
    const codeHash = createHash('sha256').update(code).digest('hex');

    if (!verificationRow) {
      logger.warn('Reset password attempt failed: reset not found', { email });
      return fail(ContractError.InvalidEmailVerificationCode);
    }

    if (verificationRow.attemptCount >= 3) {
      logger.warn('Reset password attempt failed: too many attempts', { email });
      return fail(ContractError.TooManyAttempts);
    }

    if (verificationRow.codeHash !== codeHash) {
      logger.warn('Reset password attempt failed: invalid code', { email });
      // Autocommits on its own connection, outside the uow: the increment must
      // survive the rollback on this path or the >= 3 lockout can never trigger.
      await systemEmailVerificationRepository.bumpValidationAttempts(verificationRow.id);
      return fail(ContractError.InvalidEmailVerificationCode);
    }
    return ok({ id: verificationRow.id });
  };

  return {
    // Failure paths return without finalizing — the controller's complete() rolls back.
    // The success path commits explicitly, because notifyUser must run post-commit.
    verifyCodeAndSetPassword: async (credentials: SignupInput) => {
      const { email, password, code, firstName, lastName, phone } = credentials;
      const codeVerifiedResult = await verifyCode(email, code);

      if (!codeVerifiedResult.success) {
        // The bad-code attempt bump is committed out-of-band by verifyCode and
        // survives the rollback that follows.
        return codeVerifiedResult;
      }
      const verificationId = codeVerifiedResult.value.id;
      let user = await userRepository.getUserByEmail(email);
      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      let template: 'welcome' | 'passwordChanged';
      if (!user) {
        user = PendingUser.create(
          { email, firstName: firstName, lastName: lastName, phone, passwordHash },
          randomUUID(),
        );
      }
      if (user.kind === 'pending') {
        template = 'welcome';
        // The activating user is their own actor: this is self-service signup off an
        // emailed code, so actorId is the pending user's id.
        // The activatePendingUserWriteService takes the responsibility for saving the user
        // to avoid having a double have here or a potentially unsaved case there
        const activateResult = await activatePendingUserWriteService(
          { firstName, lastName, phone, passwordHash },
          user,
          user.id(),
        );

        if (!activateResult.success) {
          // Propagate the specific failure (e.g. MISSING_FIRST_OR_LAST_NAME) instead of a
          // generic ErrorActivatingUser: the forgot-password door lands a brand-new email
          // here with no name, and the FE reveals the name fields off that exact reason.
          return activateResult;
        }
      } else if (user.kind === 'active') {
        template = 'passwordChanged';
        user.setPassword(passwordHash, user.id());
        await userRepository.save(user);
      } else {
        return assertNever(user);
      }

      await emailVerificationRepository.completeConsumption(verificationId);

      return ok({ template, userId: user.id() });
    },
  };
};
