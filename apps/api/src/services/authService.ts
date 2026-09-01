import {
  assertNever,
  ContractError,
  fail,
  ok,
  OperationResult,
  type SignupInput,
} from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import {
  ActivatePendingUserWriteService,
  EmailVerificationRepository,
  EntityId,
  PendingUser,
  SystemEmailVerificationRepository,
  UnitOfWork,
  UserRepository,
} from '@packages/media-core';
import { NotificationService } from '@packages/notifications';
import bcrypt from 'bcryptjs';
import { ScopeRoot } from 'ioc-manifest';
import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import type { Config } from '../config.js';

export interface AuthService {
  verifyCodeAndSetPassword: (
    credentials: SignupInput,
  ) => Promise<OperationResult<{ token: string }>>;
  settle: (ok: boolean) => Promise<void>;
}

type AuthServiceDeps = {
  logger: Logger;
  config: Config;
  notificationService: NotificationService;
  userRepository: UserRepository;
  emailVerificationRepository: EmailVerificationRepository;
  systemEmailVerificationRepository: SystemEmailVerificationRepository;
  activatePendingUserWriteService: ActivatePendingUserWriteService;
  uow: UnitOfWork;
};

export const build__AuthService = ({
  logger,
  config,
  notificationService,
  userRepository,
  emailVerificationRepository,
  systemEmailVerificationRepository,
  activatePendingUserWriteService,
  uow,
}: AuthServiceDeps): ScopeRoot<AuthService, Record<string, never>> => {
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

  const notifyUser = async (
    id: EntityId,
    creds: SignupInput,
    template: 'welcome' | 'passwordChanged',
  ): Promise<string> => {
    const { email, firstName, lastName } = creds;
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: id,
        email: email,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions,
    );
    const result = await notificationService.notify({
      to: { email },
      channels: ['email'],
      template,
      data: {
        firstName,
        lastName,
        appUrl: config.clientUrl,
        changedAt: new Date().toISOString(),
      },
    });

    if (result.success) {
      logger.info('User signed up successfully', {
        userId: id,
        email: email,
      });
    } else {
      logger.error('Failed to send welcome email', {
        userId: id,
        email: email,
        error: result.error.display,
      });
    }
    return token;
  };

  return {
    // Failure paths return without finalizing — the controller's settle() rolls back.
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
      await uow.complete(true);

      // Post-commit, best-effort: emailing the user must not affect the committed
      // write, and a failure here must not roll the transaction back (already committed).
      const token = await notifyUser(user.id(), credentials, template);
      return ok({ token });
    },

    settle: uow.settle,
  };
};
