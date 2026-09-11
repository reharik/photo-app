/**
 * Integration coverage for AuthQueryService (login + verifyEmail) against the real
 * Postgres the api uses.
 *
 * The service used to take a bare knex handle and could be constructed by hand
 * here. It reads and writes through `uow.db()` now, which throws outside a
 * transaction, so it has to be resolved out of a real scope and its calls have to
 * run inside a boundary — the same shape `AuthController` uses
 * (`uow.inTransaction(() => authQueryService.login(...))`). `uow` is an ordinary
 * scoped sibling, so one `createScope()` gives the service and this test the SAME
 * unit of work; that is what lets the `inScope` helper below open the boundary the
 * service then reads and writes through.
 *
 * Covers: login success (case-normalized email is the caller's job, so the row is
 * seeded lowercase), login bad password, login unknown user; verifyEmail returns
 * the plaintext code, stores only its hash, and invalidates any prior live code
 * for that email.
 */
import type { AwilixContainer } from 'awilix';
import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';
import { createHash, randomUUID } from 'node:crypto';

import type { AppCradle } from '../di/generated/ioc-composed.js';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const TEST_EMAILS = ['rai76-login@example.test', 'rai76-verify@example.test'] as const;

describe('AuthQueryService (integration)', () => {
  let container: AwilixContainer<AppCradle>;
  let database: Knex;

  const cleanup = async (): Promise<void> => {
    await database('emailVerification')
      .whereIn('email', [...TEST_EMAILS])
      .del();
    await database('user')
      .whereIn('email', [...TEST_EMAILS])
      .del();
  };

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    database = container.resolve('database');
  });

  beforeEach(cleanup);
  afterEach(cleanup);

  /**
   * One scope, one uow, one boundary per call — a fresh scope each time so no test
   * inherits a half-closed transaction from the one before it. Assertions read
   * through the raw pooled `database` afterwards, so they only ever see committed
   * state.
   */
  const inScope = async <T>(
    fn: (service: AppCradle['authQueryService']) => Promise<T>,
  ): Promise<T> => {
    const scope = container.createScope();
    try {
      const uow = scope.resolve('uow');
      const service = scope.resolve('authQueryService');
      return await uow.inTransaction(() => fn(service));
    } finally {
      await scope.dispose();
    }
  };

  const seedUser = async (email: string, password: string): Promise<string> => {
    const id = randomUUID();
    await database('user').insert({
      id,
      email,
      firstName: 'Login',
      lastName: 'Tester',
      userStatus: 'ACTIVE',
      passwordHash: await bcrypt.hash(password, 12),
      emailVerified: true,
      createdBy: id,
      updatedBy: id,
    });
    return id;
  };

  describe('login', () => {
    it('returns a user + token for correct credentials', async () => {
      const email = 'rai76-login@example.test';
      const id = await seedUser(email, 'correctPassword1');

      const result = await inScope((service) =>
        service.login({ email, password: 'correctPassword1' }),
      );

      expect(result).toBeDefined();
      expect(result?.user.id).toBe(id);
      expect(result?.user.email).toBe(email);
      // passwordHash must be stripped from the returned user.
      expect((result?.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
      expect(typeof result?.token).toBe('string');
      expect(result?.token.length).toBeGreaterThan(0);
    });

    it('records the login timestamp, and that write commits with the boundary', async () => {
      const email = 'rai76-login@example.test';
      const id = await seedUser(email, 'correctPassword1');
      expect((await database('user').where({ id }).first())?.lastLoginAt ?? null).toBeNull();

      await inScope((service) => service.login({ email, password: 'correctPassword1' }));

      // login is not a pure read — it stamps lastLoginAt through `uow.db()`. Read it
      // back on the pooled handle to prove the boundary committed rather than
      // leaving the write stranded in a rolled-back transaction.
      expect((await database('user').where({ id }).first())?.lastLoginAt).toBeTruthy();
    });

    it('returns undefined for a wrong password', async () => {
      const email = 'rai76-login@example.test';
      await seedUser(email, 'correctPassword1');

      const result = await inScope((service) =>
        service.login({ email, password: 'wrongPassword2' }),
      );

      expect(result).toBeUndefined();
    });

    it('returns undefined for an unknown user', async () => {
      const result = await inScope((service) =>
        service.login({
          email: 'rai76-login@example.test',
          password: 'whatever1',
        }),
      );

      expect(result).toBeUndefined();
    });
  });

  describe('verifyEmail', () => {
    const liveVerifications = (email: string) =>
      database('emailVerification')
        .where({ email, consumedAt: null })
        .andWhere('expiresAt', '>', database.fn.now());

    it('returns the plaintext code and stores a fresh, unconsumed, unexpired row holding only its hash', async () => {
      const email = 'rai76-verify@example.test';

      const result = await inScope((service) => service.verifyEmail(email));

      expect(result.success).toBe(true);
      // The caller (AuthController) needs the plaintext to email it; the service is
      // the only place it exists in the clear.
      const code = result.success ? result.value : '';
      expect(code).toMatch(/^\d{6}$/);

      const live = await liveVerifications(email);
      expect(live).toHaveLength(1);
      expect(live[0]!.consumedAt ?? null).toBeNull();
      // Only the hash is persisted — a database read must not yield a usable code.
      expect(live[0]!.codeHash).toBe(sha256(code));
    });

    it('invalidates the previous live code when a new one is issued', async () => {
      const email = 'rai76-verify@example.test';

      await inScope((service) => service.verifyEmail(email));
      await inScope((service) => service.verifyEmail(email));

      // Two rows total, but only the most recent is still live.
      const all = await database('emailVerification').where({ email });
      expect(all.length).toBe(2);
      const live = await liveVerifications(email);
      expect(live).toHaveLength(1);
    });
  });
});
