import {
  ContractError,
  fail,
  ok,
  WriteResult,
  type AuthResponse,
  type LoginInput,
  type SignupInput,
  type User,
} from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import {
  assertNever,
  User as DomainUser,
  EmailVerificationRepository,
  EntityId,
  hashToken,
  UnitOfWork,
  UserRepository,
} from '@packages/media-core';
import { NotificationService } from '@packages/notifications';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Knex } from 'knex';
import { DateTime } from 'luxon';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import type { Config } from '../config.js';

export type SanitizedUser = Omit<User, 'passwordHash'>;

export interface AuthService {
  login: (credentials: LoginInput) => Promise<AuthResponse | undefined>;
  verifyEmail: (email: string) => Promise<WriteResult<void>>;
  verifyCodeAndSetPassword: (credentials: SignupInput) => Promise<WriteResult<{ token: string }>>;
  verifyJWTToken: (token: string) => Promise<User | undefined>;
  hashPassword: (password: string) => Promise<string>;
  publicAccess: (token: string) => Promise<{ publicAccessId: string; albumId: string } | undefined>;
}

type UserRow = User & {
  passwordHash?: string;
  phone?: string;
  smsOptIn?: boolean;
};

const sanitizeUser = (user: UserRow): SanitizedUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...sanitized } = user;
  return sanitized;
};

type AuthServiceDeps = {
  database: Knex;
  logger: Logger;
  config: Config;
  notificationService: NotificationService;
  userRepository: UserRepository;
  emailVerificationRepository: EmailVerificationRepository;
  uow: UnitOfWork;
};

export const build__AuthService = ({
  database,
  logger,
  config,
  notificationService,
  userRepository,
  emailVerificationRepository,
  uow,
}: AuthServiceDeps): AuthService => {
  const verifyCode = async (email: string, code: string): Promise<WriteResult<{ id: string }>> => {
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
      await emailVerificationRepository.bumpValidationAttempts(verificationRow.id);
      return fail(ContractError.InvalidEmailVerificationCode);
    }
    return ok({ id: verificationRow.id });
  };

  const notifyUser = async (
    id: EntityId,
    creds: SignupInput,
    template: 'welcome' | 'passwordReset',
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
    login: async (credentials: LoginInput) => {
      const { email, password } = credentials;

      // Find user by email
      const user = await database<UserRow>('user').where({ email }).first();
      if (!user || !user.passwordHash) {
        logger.warn('Login attempt failed: user not found or no password hash', {
          email,
          hasUser: !!user,
          hasPasswordHash: !!user?.passwordHash,
        });
        return undefined;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        logger.warn('Login attempt failed: invalid password', {
          email,
          userId: user.id,
        });
        return undefined;
      }

      // Update last login
      await database('user')
        .where({ id: user.id })
        .update({ lastLoginAt: new Date().toISOString() });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions,
      );

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
      });

      return { user: sanitizeUser(user), token };
    },

    verifyEmail: async (email: string) => {
      // invalidate existing records
      const currentTime = DateTime.now();
      await database('emailVerification')
        .where({ email })
        .andWhere('expiresAt', '>', database.fn.now())
        .update({ expiresAt: currentTime.minus({ minutes: 1 }).toISO() });

      // generate new code
      const code = randomInt(0, 1000000).toString().padStart(6, '0');
      const codeHash = createHash('sha256').update(code).digest('hex');

      //store new record
      await database('passwordReset').insert({
        id: randomUUID(),
        email: email,
        codeHash: codeHash,
        expiresAt: currentTime.plus({ minutes: 10 }).toISO(),
      });

      void notificationService.notify({
        to: { email },
        channels: ['email'],
        template: 'emailVerification',
        data: {
          code,
        },
      });

      return ok(undefined);
    },

    verifyCodeAndSetPassword: async (credentials: SignupInput) => {
      const { email, password, code, firstName, lastName, phone } = credentials;
      const codeVerifiedResult = await verifyCode(email, code);
      if (!codeVerifiedResult.success) {
        return codeVerifiedResult;
      }
      const verificationId = codeVerifiedResult.value.id;
      let user = await userRepository.getUserByEmail(email);
      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      let template: 'welcome' | 'passwordReset';
      if (!user) {
        template = 'welcome';
        user = DomainUser.create(
          { email, firstName: firstName ?? '', lastName: lastName ?? '', phone, passwordHash },
          randomUUID(),
        );
        // this else is ugly, true, but it's the only true way we can handle the three cases.
        // we can't pass the new user in and have activate set the pw because that also sets the template
      } else {
        switch (user.kind) {
          case 'pending': {
            template = 'welcome';
            const activateResult = user.activate(
              { firstName, lastName, phone, passwordHash },
              user.id(),
            );
            if (!activateResult.success) {
              return fail(ContractError.ErrorActivatingUser);
            }
            break;
          }
          case 'active': {
            template = 'passwordReset';
            user.setPassword(passwordHash, user.id());
            break;
          }
          default: {
            return assertNever(user);
          }
        }
      }
      await userRepository.save(user);
      await emailVerificationRepository.completeConsumption(verificationId);
      await uow.commit();

      const token = await notifyUser(user.id(), credentials, template);
      return ok({ token });
    },
    /*
    during event driven grant creation, the event will have the authId, the auth with have the userid
    when you get the user use the repository that calls for straight user, not pendingUser.  this will
    not find a user for this auth and it will be ignored.
*/

    verifyJWTToken: async (token: string) => {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as {
          userId: string;
          email: string;
        };

        const user = await database<UserRow>('user').where({ id: decoded.userId }).first();

        if (!user) {
          logger.warn('Token verification failed: user not found', {
            userId: decoded.userId,
            email: decoded.email,
          });
          return undefined;
        }

        return user;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorType = err instanceof Error ? err.name : 'Unknown';
        logger.warn('Token verification failed: invalid or expired token', {
          error: errorMessage,
          errorType,
        });
        return undefined;
      }
    },

    publicAccess: async (token: string) => {
      const hashedToken = hashToken(token);
      console.log('[VALIDATE] token:', JSON.stringify(token));
      console.log('[VALIDATE] hash:', hashedToken);

      const authenticated = await database('share_link')
        .where({ link_token: hashedToken })
        .whereNull('revoked_at')
        .where((b) => {
          b.whereNull('expires_at').orWhere('expires_at', '>', database.fn.now());
        })
        .first<{ publicAccessId: string; albumId: string }>('id as publicAccessId, albumId');

      if (!authenticated.publicAccessId) {
        logger.warn('Authentication attempt failed: token not found ');
        return undefined;
      }

      logger.info('token verified successfully', {
        id: authenticated.publicAccessId,
      });

      return authenticated;
    },

    hashPassword: async (password: string) => {
      return bcrypt.hash(password, 12);
    },
  };
};
