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
  start: () => Promise<void>;
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
      // Autocommit, OUTSIDE the uow: this durably persists the attempt increment even though
      // the caller rolls the password-reset transaction back on this failure path. Awaited here
      // so the bump is committed before that rollback — otherwise the lockout could be bypassed.
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
    verifyCodeAndSetPassword: async (credentials: SignupInput) => {
      // This service owns uow finalization: the caller starts the uow (via
      // beginUnitOfWorkScope) but does NOT wrap it in withUnitOfWork, because the
      // success path must commit while the failure paths must NOT. Every exit below
      // finalizes the transaction exactly once — commit on success, rollback otherwise.
      const { email, password, code, firstName, lastName, phone } = credentials;
      // Tracks whether the uow has been committed, so the catch never rolls back a
      // committed transaction (e.g. if the post-commit notify throws).
      let committed = false;
      try {
        const codeVerifiedResult = await verifyCode(email, code);
        if (!codeVerifiedResult.success) {
          // No verification row / too many attempts / bad code. The bad-code attempt
          // bump was already durably committed out-of-band by verifyCode; the reset
          // transaction itself has no writes to keep, so roll it back.
          await uow.complete(false);
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
            await uow.complete(false);

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

        committed = true;

        // Post-commit, best-effort: emailing the user must not affect the committed
        // write, and a failure here must not roll the transaction back (already committed).
        const token = await notifyUser(user.id(), credentials, template);
        return ok({ token });
      } catch (error) {
        // Any throw after uow.start() (db error, assertNever, etc.) leaves an open trx —
        // roll it back before rethrowing, unless we already committed.
        if (!committed) {
          await uow.complete(false);
        }
        throw error;
      }
    },

    /*
    during event driven grant creation, the event will have the authId, the auth with have the userid
    when you get the user use the repository that calls for straight user, not pendingUser.  this will
    not find a user for this auth and it will be ignored.
*/
    start: uow.start,
  };
};
