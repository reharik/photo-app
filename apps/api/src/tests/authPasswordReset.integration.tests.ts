/**
 * RAI-76: This file previously tested the DELETED password-reset API
 * (authService.forgotPassword / resetPassword against a `password_reset` table).
 * That flow no longer exists — it was replaced by the unified
 * `verifyCodeAndSetPassword` write path. The dead tests were removed and this
 * file repurposed in place (the `rm`/`mv` shell ops are blocked in this
 * environment, so the file could not be renamed — see REVIEW.md). It now holds
 * the real integration coverage for `AuthService.verifyCodeAndSetPassword`,
 * exercised through the same uow-scope path the controller uses.
 *
 * Oracle (E1–E6):
 *  E1 no verification row      → reject; nothing persisted
 *  E2 attemptCount >= 3        → lockout reject; nothing persisted; counter NOT bumped
 *  E3 bad code                 → reject; attemptCount increment PERSISTS across rollback
 *  E4 pending activate() fails → reject; uow rolled back (not consumed, still pending)
 *  E6 success                  → user saved AND verification consumed ATOMICALLY;
 *                                notify fires AFTER commit
 */
import { ContractError, ok } from '@packages/contracts';
import { beginUnitOfWorkScope } from '@packages/media-core';
import type { NotificationService } from '@packages/notifications';
import type { AwilixContainer } from 'awilix';
import { asValue } from 'awilix';
import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';
import { DateTime } from 'luxon';
import assert from 'node:assert';
import { createHash, randomUUID } from 'node:crypto';

import type { SignupInput } from '@packages/contracts';
import type { AppCradle } from '../di/generated/ioc-composed.js';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const TEST_EMAILS = [
  'rai76-new@example.test',
  'rai76-active@example.test',
  'rai76-pending@example.test',
  'rai76-badcode@example.test',
  'rai76-locked@example.test',
  'rai76-missing@example.test',
] as const;

const VALID_CODE = '654321';

/** Captured notify invocation together with the committed DB state observed AT notify time. */
type NotifyObservation = {
  template: string;
  email: string;
  /** true if a `user` row for this email was already visible (committed) when notify ran */
  committedUserVisible: boolean;
  /** true if the email_verification row was already consumed (committed) when notify ran */
  committedVerificationConsumed: boolean;
};

describe('AuthService.verifyCodeAndSetPassword (integration)', () => {
  let container: AwilixContainer<AppCradle>;
  let database: Knex;
  let observations: NotifyObservation[];
  let notifyImpl: NotificationService['notify'];

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

    // Spy notification service: records the COMMITTED db state at the moment notify
    // is invoked. Because verifyCodeAndSetPassword only calls notify AFTER commit, a
    // committed user row / consumed verification visible here proves ordering.
    const spy: NotificationService = {
      notify: async (payload) => {
        const email = typeof payload.to === 'string' ? payload.to : (payload.to.email ?? '');
        const userRow = await database('user').where({ email }).first();
        const verificationRow = await database('emailVerification')
          .where({ email })
          .orderBy('createdAt', 'desc')
          .first<{ consumedAt?: string }>();
        observations.push({
          template: payload.template,
          email,
          committedUserVisible: Boolean(userRow),
          committedVerificationConsumed: Boolean(verificationRow?.consumedAt),
        });
        return notifyImpl(payload);
      },
    };
    (container as unknown as AwilixContainer).register({
      notificationService: asValue(spy),
    });
  });

  beforeEach(async () => {
    observations = [];
    notifyImpl = async () => ok('notif-id');
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  const seedVerification = async (
    email: string,
    opts: {
      code?: string;
      attemptCount?: number;
      expiresInMinutes?: number;
      consumed?: boolean;
    } = {},
  ): Promise<string> => {
    const { code = VALID_CODE, attemptCount = 0, expiresInMinutes = 10, consumed = false } = opts;
    const id = randomUUID();
    await database('emailVerification').insert({
      id,
      email,
      codeHash: sha256(code),
      expiresAt: DateTime.now().plus({ minutes: expiresInMinutes }).toISO(),
      consumedAt: consumed ? DateTime.now().toISO() : null,
      attemptCount,
    });
    return id;
  };

  const seedUser = async (
    email: string,
    opts: { status: 'ACTIVE' | 'PENDING'; passwordHash?: string | null; phone?: string | null } = {
      status: 'ACTIVE',
    },
  ): Promise<string> => {
    const id = randomUUID();
    await database('user').insert({
      id,
      email,
      firstName: 'Seed',
      lastName: 'User',
      userStatus: opts.status,
      passwordHash: opts.passwordHash ?? null,
      phone: opts.phone ?? null,
      emailVerified: false,
      createdBy: id,
      updatedBy: id,
    });
    return id;
  };

  /** Mirror the controller: fresh uow scope, resolve the scoped authService, run the write. */
  const runVerify = (
    creds: SignupInput,
  ): Promise<Awaited<ReturnType<AppCradle['authService']['verifyCodeAndSetPassword']>>> =>
    (async () => {
      const { scope } = await beginUnitOfWorkScope(container);
      const svc = scope.resolve('authService');
      return svc.verifyCodeAndSetPassword(creds);
    })();

  const baseCreds = (email: string, overrides: Partial<SignupInput> = {}): SignupInput => ({
    email,
    password: 'newPassword9',
    code: VALID_CODE,
    firstName: 'Given',
    lastName: 'Family',
    smsOptIn: false,
    ...overrides,
  });

  const getVerification = (email: string) =>
    database('emailVerification')
      .where({ email })
      .orderBy('createdAt', 'desc')
      .first<{ attemptCount: number; consumedAt?: string }>();

  const getUser = (email: string) =>
    database('user').where({ email }).first<{ passwordHash?: string; userStatus: unknown }>();

  const statusValue = (raw: unknown): string =>
    typeof raw === 'string' ? raw : (raw as { value: string }).value;

  describe('E1 — no verification row', () => {
    it('rejects with InvalidEmailVerificationCode and persists nothing', async () => {
      const email = 'rai76-missing@example.test';

      const result = await runVerify(baseCreds(email));

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.InvalidEmailVerificationCode)).toBe(true);
      expect(await getUser(email)).toBeUndefined();
      expect(observations).toHaveLength(0);
    });
  });

  describe('E2 — attemptCount >= 3', () => {
    it('rejects with TooManyAttempts, does not consume, does not bump, creates no user', async () => {
      const email = 'rai76-locked@example.test';
      await seedVerification(email, { attemptCount: 3 });

      const result = await runVerify(baseCreds(email));

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.TooManyAttempts)).toBe(true);
      const verification = await getVerification(email);
      // Lockout returns BEFORE the bad-code bump, so the counter is untouched...
      expect(verification?.attemptCount).toBe(3);
      // ...and nothing was consumed or created.
      expect(verification?.consumedAt).toBeUndefined();
      expect(await getUser(email)).toBeUndefined();
      expect(observations).toHaveLength(0);
    });
  });

  describe('E3 — bad code', () => {
    it('rejects and the attemptCount increment PERSISTS across the uow rollback', async () => {
      const email = 'rai76-badcode@example.test';
      await seedVerification(email, { code: VALID_CODE, attemptCount: 0 });

      const result = await runVerify(baseCreds(email, { code: '000000' }));

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.InvalidEmailVerificationCode)).toBe(true);
      // The bump is an autocommit gateway OUTSIDE the uow — it must survive the rollback.
      const verification = await getVerification(email);
      expect(verification?.attemptCount).toBe(1);
      expect(verification?.consumedAt).toBeUndefined();
      expect(await getUser(email)).toBeUndefined();
      expect(observations).toHaveLength(0);
    });
  });

  describe('E4 — pending user activate() fails', () => {
    it('rolls back: verification not consumed, user stays pending with no password', async () => {
      const email = 'rai76-pending@example.test';
      await seedUser(email, { status: 'PENDING', passwordHash: null });
      await seedVerification(email);

      // Invalid phone (too short) makes PendingUser.activate() return ErrorActivatingUser.
      const result = await runVerify(baseCreds(email, { phone: '123' }));

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.ErrorActivatingUser)).toBe(true);
      const verification = await getVerification(email);
      expect(verification?.consumedAt).toBeUndefined();
      const user = await getUser(email);
      expect(user).toBeDefined();
      expect(statusValue(user?.userStatus)).toBe('PENDING');
      expect(user?.passwordHash ?? null).toBeNull();
      expect(observations).toHaveLength(0);
    });
  });

  describe('E6 — success (new user)', () => {
    // RAI-76: the earlier new-user-not-persisted bug is fixed. The new-user branch
    // (authService.ts) now creates a PendingUser via PendingUser.create (no id → isNew
    // true, so the row persists) AND calls activate(), flipping userStatus → ACTIVE and
    // setting the password. These tests assert that end state: the new user is saved
    // ACTIVE + password-usable, the verification is consumed atomically, and notify fires
    // AFTER commit.
    it('atomically creates the active user and consumes the verification, notifying AFTER commit', async () => {
      const email = 'rai76-new@example.test';
      await seedVerification(email);

      const result = await runVerify(baseCreds(email));

      expect(result.success).toBe(true);
      assert(result.success);
      expect(typeof result.value.token).toBe('string');
      expect(result.value.token.length).toBeGreaterThan(0);

      // Atomic: user persisted AND verification consumed in the same committed uow.
      const user = await getUser(email);
      expect(user).toBeDefined();
      expect(statusValue(user?.userStatus)).toBe('ACTIVE');
      expect(await bcrypt.compare('newPassword9', user.passwordHash!)).toBe(true);
      const verification = await getVerification(email);
      expect(verification?.consumedAt).toBeDefined();

      // notify fired once, AFTER commit (committed user + consumed verification visible),
      // with the new-user 'welcome' template.
      expect(observations).toHaveLength(1);
      expect(observations[0].template).toBe('welcome');
      expect(observations[0].committedUserVisible).toBe(true);
      expect(observations[0].committedVerificationConsumed).toBe(true);
    });

    it('a notify REJECTION does not roll back the committed user (throws post-commit)', async () => {
      const email = 'rai76-new@example.test';
      await seedVerification(email);
      notifyImpl = async () => {
        throw new Error('SES down');
      };

      await expect(runVerify(baseCreds(email))).rejects.toThrow('SES down');

      // The user + consumption committed before notify, so they survive the post-commit throw.
      const user = await getUser(email);
      expect(user).toBeDefined();
      expect(statusValue(user?.userStatus)).toBe('ACTIVE');
      const verification = await getVerification(email);
      expect(verification?.consumedAt).toBeDefined();
    });
  });

  describe('E6 — success (existing active user → password reset)', () => {
    it('updates the password and consumes the verification, notifying with passwordReset', async () => {
      const email = 'rai76-active@example.test';
      const oldHash = await bcrypt.hash('oldPassword1', 12);
      await seedUser(email, { status: 'ACTIVE', passwordHash: oldHash });
      await seedVerification(email);

      const result = await runVerify(baseCreds(email));

      expect(result.success).toBe(true);
      const user = await getUser(email);
      expect(await bcrypt.compare('newPassword9', user.passwordHash!)).toBe(true);
      expect(await bcrypt.compare('oldPassword1', user.passwordHash!)).toBe(false);
      const verification = await getVerification(email);
      expect(verification?.consumedAt).toBeDefined();
      expect(observations).toHaveLength(1);
      expect(observations[0].template).toBe('passwordReset');
      expect(observations[0].committedUserVisible).toBe(true);
      // The verification is consumed INSIDE the uow; its being visibly-consumed at
      // notify time proves notify ran AFTER commit (not before).
      expect(observations[0].committedVerificationConsumed).toBe(true);
    });
  });
});
