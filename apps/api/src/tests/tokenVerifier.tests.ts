/**
 * RAI-76: Unit coverage for TokenVerifier.verifyJWTToken. Pure unit — the JWT is
 * signed in-test and the knex handle is a tiny stub, so no DB/process boundary is
 * crossed. Covers: valid token → user; expired / malformed / wrong-secret token →
 * undefined; valid token but user missing → undefined.
 */
import { describe, expect, it, jest } from '@jest/globals';
import type { Logger } from '@packages/infrastructure';
import jwt from 'jsonwebtoken';
import type { Knex } from 'knex';

import type { Config } from '../config.js';
import { build__TokenVerifier } from '../services/tokenVerifier.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
} satisfies Logger;

const SECRET = 'unit-jwt-secret';
const config = { jwtSecret: SECRET } as unknown as Config;

/** Minimal knex stub: `database('user').where(...).first()` resolves to `row`. */
const stubDb = (row: unknown): Knex =>
  (() => ({
    where: () => ({ first: async () => row }),
  })) as unknown as Knex;

const sign = (payload: object, options?: jwt.SignOptions): string =>
  jwt.sign(payload, SECRET, options);

describe('TokenVerifier.verifyJWTToken', () => {
  const user = { id: 'u1', email: 'user@example.test', passwordHash: 'hash' };

  it('returns the user for a valid token', async () => {
    const verifier = build__TokenVerifier({ database: stubDb(user), config, logger });
    const token = sign({ userId: 'u1', email: 'user@example.test' });

    const result = await verifier.verifyJWTToken(token);

    expect(result).toEqual(user);
  });

  it('returns undefined for an expired token', async () => {
    const verifier = build__TokenVerifier({ database: stubDb(user), config, logger });
    const token = sign({ userId: 'u1', email: 'user@example.test' }, { expiresIn: '-10s' });

    expect(await verifier.verifyJWTToken(token)).toBeUndefined();
  });

  it('returns undefined for a malformed token', async () => {
    const verifier = build__TokenVerifier({ database: stubDb(user), config, logger });

    expect(await verifier.verifyJWTToken('not-a-jwt')).toBeUndefined();
  });

  it('returns undefined for a token signed with the wrong secret', async () => {
    const verifier = build__TokenVerifier({ database: stubDb(user), config, logger });
    const token = jwt.sign({ userId: 'u1', email: 'user@example.test' }, 'some-other-secret');

    expect(await verifier.verifyJWTToken(token)).toBeUndefined();
  });

  it('returns undefined when the token is valid but the user no longer exists', async () => {
    const verifier = build__TokenVerifier({ database: stubDb(undefined), config, logger });
    const token = sign({ userId: 'ghost', email: 'ghost@example.test' });

    expect(await verifier.verifyJWTToken(token)).toBeUndefined();
  });
});
