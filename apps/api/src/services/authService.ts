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
import { hashToken } from '@packages/media-core';
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
  signup: (credentials: SignupInput) => Promise<AuthResponse | undefined>;
  forgotPassword: (email: string) => Promise<WriteResult<void>>;
  resetPassword: (email: string, password: string, code: string) => Promise<WriteResult<void>>;
  verifyJWTToken: (token: string) => Promise<User | undefined>;
  hashPassword: (password: string) => Promise<string>;
  comparePassword: (password: string, hash: string) => Promise<boolean>;
  publicAccess: (token: string) => Promise<{ publicAccessId: string; albumId: string } | undefined>;
}

type UserRow = User & {
  passwordHash?: string;
  phone?: string;
  smsOptIn?: boolean;
};

type PasswordResetRow = {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: string;
  consumedAt: string | null;
  attemptCount: number;
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
};

export const build__AuthService = ({
  database,
  logger,
  config,
  notificationService,
}: AuthServiceDeps): AuthService => ({
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
    await database('user').where({ id: user.id }).update({ lastLoginAt: new Date().toISOString() });

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

  signup: async (credentials: SignupInput) => {
    const { email, password, firstName, lastName, phone, smsOptIn } = credentials;

    // Check if user already exists
    const existingUser = await database<UserRow>('user').where({ email }).first();
    if (existingUser) {
      logger.warn('Signup attempt failed: user already exists', { email });
      return undefined;
    }

    const id = randomUUID();

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [user] = await database<UserRow>('user')
      .insert({
        id,
        email,
        firstName,
        lastName,
        ...(phone !== undefined ? { phone } : {}),
        passwordHash,
        emailVerified: false,
        smsOptIn: smsOptIn ?? false,
        createdBy: id,
        updatedBy: id,
      })
      .returning('*');

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions,
    );

    const result = await notificationService.notify({
      to: { email },
      channels: ['email'],
      template: 'welcome',
      data: {
        firstName,
        lastName,
        appUrl: config.clientUrl,
        appName: config.appName,
      },
    });

    if (result.success) {
      logger.info('User signed up successfully', {
        userId: user.id,
        email: user.email,
      });
    } else {
      logger.error('Failed to send welcome email', {
        userId: user.id,
        email: user.email,
        error: result.error.display,
      });
    }
    return { user: sanitizeUser(user), token };
  },

  forgotPassword: async (email: string) => {
    const user = await database<UserRow>('user').where({ email }).first();
    if (!user) {
      logger.warn('Forgot password attempt failed: user not found', { email });
      return ok(undefined);
    }
    // invalidate existing records
    const currentTime = DateTime.now();
    await database('passwordReset')
      .where({ userId: user.id })
      .andWhere('expiresAt', '>', database.fn.now())
      .update({ expiresAt: currentTime.minus({ minutes: 1 }).toISO() });

    // generate new code
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = createHash('sha256').update(code).digest('hex');

    //store new record
    await database('passwordReset').insert({
      id: randomUUID(),
      userId: user.id,
      codeHash: codeHash,
      expiresAt: currentTime.plus({ minutes: 10 }).toISO(),
    });

    void notificationService.notify({
      to: { email },
      channels: ['email'],
      template: 'forgotPassword',
      data: {
        code,
        firstName: user.firstName,
        appName: config.appName,
      },
    });

    return ok(undefined);
  },

  resetPassword: async (email: string, password: string, code: string) => {
    const user = await database<UserRow>('user').where({ email }).first();
    if (!user) {
      logger.warn('Reset password attempt failed: user not found', { email });
      return fail(ContractError.InvalidPasswordResetCode);
    }
    const reset = await database('passwordReset')
      .where({ userId: user.id, consumedAt: null })
      .andWhere('expiresAt', '>', database.fn.now())
      .first<PasswordResetRow>();

    if (!reset) {
      logger.warn('Reset password attempt failed: reset not found', { email });
      return fail(ContractError.InvalidPasswordResetCode);
    }

    if (reset.attemptCount >= 3) {
      logger.warn('Reset password attempt failed: too many attempts', { email });
      return fail(ContractError.TooManyAttempts);
    }

    const codeHash = createHash('sha256').update(code).digest('hex');
    if (reset.codeHash !== codeHash) {
      logger.warn('Reset password attempt failed: invalid code', { email });
      await database('passwordReset')
        .where({ id: reset.id })
        .update({ attemptCount: reset.attemptCount + 1 });
      return fail(ContractError.InvalidPasswordResetCode);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    await database('user').where({ id: user.id }).update({ passwordHash });
    await database('passwordReset')
      .where({ id: reset.id })
      .update({ consumedAt: new Date().toISOString() });

    await notificationService.notify({
      to: { email },
      channels: ['email'],
      template: 'passwordReset',
      data: {
        firstName: user.firstName ?? '',
      },
    });
    return ok(undefined);
  },

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

  comparePassword: async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
  },
});
