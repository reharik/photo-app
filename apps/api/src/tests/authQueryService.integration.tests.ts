/**
 * RAI-76: Integration coverage for AuthQueryService (login + verifyEmail) against
 * the real Postgres the api uses. AuthQueryService takes a bare knex handle (no
 * uow), so it is constructed directly here — same pattern the deleted
 * authPasswordReset integration test used. Self-cleaning by test email.
 *
 * Covers: login success (case-normalized email is the caller's job, so the row is
 * seeded lowercase), login bad password, login unknown user; verifyEmail stores a
 * fresh valid code and invalidates any prior live code for that email.
 */
import { ok } from '@packages/contracts';
import type { NotificationService } from '@packages/notifications';
import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';
import knexFactory from 'knex';
import { randomUUID } from 'node:crypto';

import { createConfigFromEnv } from '../config.js';
import { build__KnexConfig } from '../knexfile.js';
import type { AuthQueryService } from '../services/authQueryService.js';
import { build__AuthQueryService } from '../services/authQueryService.js';

const TEST_EMAILS = ['rai76-login@example.test', 'rai76-verify@example.test'] as const;

const noopNotificationService: NotificationService = {
  notify: async () => ok('notif-id'),
};

describe('AuthQueryService (integration)', () => {
  let database: Knex;
  let service: AuthQueryService;

  const cleanup = async (): Promise<void> => {
    await database('emailVerification')
      .whereIn('email', [...TEST_EMAILS])
      .del();
    await database('user')
      .whereIn('email', [...TEST_EMAILS])
      .del();
  };

  beforeAll(async () => {
    const config = createConfigFromEnv();
    database = knexFactory(build__KnexConfig({ config }));
    const g = globalThis as typeof globalThis & { __photoappTestKnex?: Knex };
    g.__photoappTestKnex = database;
    service = build__AuthQueryService({
      database,
      config,
      logger: {
        debug: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        http: () => undefined,
        verbose: () => undefined,
      },
      notificationService: noopNotificationService,
    });
  });

  beforeEach(cleanup);
  afterEach(cleanup);

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

      const result = await service.login({ email, password: 'correctPassword1' });

      expect(result).toBeDefined();
      expect(result?.user.id).toBe(id);
      expect(result?.user.email).toBe(email);
      // passwordHash must be stripped from the returned user.
      expect((result?.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
      expect(typeof result?.token).toBe('string');
      expect(result?.token.length).toBeGreaterThan(0);
    });

    it('returns undefined for a wrong password', async () => {
      const email = 'rai76-login@example.test';
      await seedUser(email, 'correctPassword1');

      const result = await service.login({ email, password: 'wrongPassword2' });

      expect(result).toBeUndefined();
    });

    it('returns undefined for an unknown user', async () => {
      const result = await service.login({
        email: 'rai76-login@example.test',
        password: 'whatever1',
      });

      expect(result).toBeUndefined();
    });
  });

  describe('verifyEmail', () => {
    const liveVerifications = (email: string) =>
      database('emailVerification')
        .where({ email, consumedAt: null })
        .andWhere('expiresAt', '>', database.fn.now());

    it('stores a fresh, unconsumed, unexpired verification row', async () => {
      const email = 'rai76-verify@example.test';

      const result = await service.verifyEmail(email);

      expect(result.success).toBe(true);
      const live = await liveVerifications(email);
      expect(live).toHaveLength(1);
      expect(live[0]!.consumedAt ?? null).toBeNull();
    });

    it('invalidates the previous live code when a new one is issued', async () => {
      const email = 'rai76-verify@example.test';

      await service.verifyEmail(email);
      await service.verifyEmail(email);

      // Two rows total, but only the most recent is still live.
      const all = await database('emailVerification').where({ email });
      expect(all.length).toBe(2);
      const live = await liveVerifications(email);
      expect(live).toHaveLength(1);
    });
  });
});
