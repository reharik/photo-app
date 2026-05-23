import {
  type AuthResponse,
  type LoginInput,
  type SignupInput,
  type User,
} from '@packages/contracts';
import { hashToken } from '@packages/media-core';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import type { AppCradle } from '../di/generated/ioc-composed.js';

export type SanitizedUser = Omit<User, 'passwordHash'>;

export interface AuthService {
  login: (credentials: LoginInput) => Promise<AuthResponse | undefined>;
  signup: (credentials: SignupInput) => Promise<AuthResponse | undefined>;
  verifyJWTToken: (token: string) => Promise<User | undefined>;
  hashPassword: (password: string) => Promise<string>;
  comparePassword: (password: string, hash: string) => Promise<boolean>;
  publicAccess: (token: string) => Promise<{ publicAccessId: string; albumId: string } | undefined>;
}

type UserRow = User & {
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
};

const sanitizeUser = (user: UserRow): SanitizedUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...sanitized } = user;
  return sanitized;
};

const splitDisplayName = (fullName: string): { firstName: string; lastName: string } => {
  const trimmed = fullName.trim();
  if (trimmed.length === 0) {
    return { firstName: '-', lastName: '-' };
  }
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx === -1) {
    return { firstName: trimmed, lastName: '-' };
  }
  const firstName = trimmed.slice(0, spaceIdx);
  const lastName = trimmed.slice(spaceIdx + 1).trim() || '-';
  return { firstName, lastName };
};

export const build__AuthService = ({ database, logger, config }: AppCradle): AuthService => ({
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
    const { email, password, name } = credentials;

    // Check if user already exists
    const existingUser = await database<UserRow>('user').where({ email }).first();
    if (existingUser) {
      logger.warn('Signup attempt failed: user already exists', { email });
      return undefined;
    }

    const id = randomUUID();
    const { firstName, lastName } = splitDisplayName(name);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [user] = await database<UserRow>('user')
      .insert({
        id,
        email,
        firstName,
        lastName,
        passwordHash,
        emailVerified: false,
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

    logger.info('User signed up successfully', {
      userId: user.id,
      email: user.email,
    });

    return { user: sanitizeUser(user), token };
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
