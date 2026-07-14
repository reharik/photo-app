import {
  ok,
  WriteResult,
  type AuthResponse,
  type LoginInput,
  type User,
} from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import { NotificationService } from '@packages/notifications';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Knex } from 'knex';
import { DateTime } from 'luxon';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import type { Config } from '../config.js';

export type SanitizedUser = Omit<User, 'passwordHash'>;

export interface AuthQueryService {
  login: (credentials: LoginInput) => Promise<AuthResponse | undefined>;
  verifyEmail: (email: string) => Promise<WriteResult<void>>;
  hashPassword: (password: string) => Promise<string>;
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

type AuthQueryServiceDeps = {
  database: Knex;
  config: Config;
  logger: Logger;
  notificationService: NotificationService;
};

export const build__AuthQueryService = ({
  database,
  config,
  logger,
  notificationService,
}: AuthQueryServiceDeps): AuthQueryService => ({
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
    await database('emailVerification').insert({
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

  hashPassword: async (password: string) => {
    return bcrypt.hash(password, 12);
  },
});
