import { type User } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import jwt from 'jsonwebtoken';
import type { Knex } from 'knex';

import type { Config } from '../config.js';

export interface TokenVerifier {
  verifyJWTToken: (token: string) => Promise<User | undefined>;
}

type UserRow = User & {
  passwordHash?: string;
  phone?: string;
  smsOptIn?: boolean;
};

type TokenVerifierDeps = {
  database: Knex;
  config: Config;
  logger: Logger;
};

export const build__TokenVerifier = ({
  database,
  config,
  logger,
}: TokenVerifierDeps): TokenVerifier => ({
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
});
