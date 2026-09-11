/**
 * Integration coverage for the set-password write path, against the real Postgres.
 *
 * History: this file once tested the DELETED password-reset API
 * (authService.forgotPassword / resetPassword against a `password_reset` table),
 * then the `verifyCodeAndSetPassword` service in isolation via the
 * `openAuthServiceScope` opener. Both are gone. The transaction boundary and the
 * post-commit notify moved UP into `AuthController`, and the AuthService scope
 * root was replaced by the single `ApiRequestContext` scope that every REST
 * request opens. So the subject here is now the controller handler, resolved out
 * of that scope exactly the way `apiRequestContextMiddleware` + `invoke()` do it
 * in production. (Renamed from authPasswordReset.integration.tests.ts.)
 *
 * Driving the controller rather than the service is deliberate: the two
 * properties this suite exists to pin — that a failure rolls the whole write
 * back, and that the email goes out only AFTER the commit — are no longer
 * properties of the service at all. The service reports failure as data; the
 * controller is what turns that into `flagRollbackOnly`, and it is what calls
 * notify once `inTransaction` has returned. Testing the service alone could no
 * longer observe either one.
 *
 * Oracle (E1–E6), unchanged in substance:
 *  E1 no verification row      → 400; nothing persisted
 *  E2 attemptCount >= 3        → 400 lockout; nothing persisted; counter NOT bumped
 *  E3 bad code                 → 400; attemptCount increment PERSISTS across rollback
 *  E4 pending activate() fails → 400; write rolled back (not consumed, still pending)
 *  E6 success                  → 200; user saved AND verification consumed ATOMICALLY;
 *                                notify fires AFTER commit; session cookie is minted
 */
import { ContractError, ok, type SignupInput } from '@packages/contracts';
import type { NotificationService } from '@packages/notifications';
import type { AwilixContainer } from 'awilix';
import { asValue } from 'awilix';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Knex } from 'knex';
import type { Context } from 'koa';
import { DateTime } from 'luxon';
import { createHash, randomUUID } from 'node:crypto';

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

/** What the handler wrote back onto the Koa context. */
type HandlerOutcome = {
  status: number;
  body: { error?: unknown; message?: string; email?: string };
  cookies: [string, string][];
};

describe('setPassword write path (integration)', () => {
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
    // is invoked. Because the controller only calls notify AFTER `inTransaction`
    // returns, a committed user row / consumed verification visible here proves
    // ordering. It reads through the raw pooled `database`, NOT the request's
    // transaction, so it genuinely cannot see uncommitted work.
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

  /**
   * Mirror production exactly: open the API request scope through its generated
   * opener, pull the controller off the scope root, run the handler, dispose in a
   * finally. This is what `apiRequestContextMiddleware` does around every REST
   * request and what `invoke('authController', 'setPassword')` does inside it.
   *
   * Nothing here starts or completes a transaction — the handler owns its own
   * boundary via `uow.inTransaction`, and reaching in to open one would break the
   * very thing under test (the real uow refuses to nest).
   */
  const runSetPassword = async (creds: SignupInput): Promise<HandlerOutcome> => {
    const cookies: [string, string][] = [];
    const ctx = {
      request: { body: creds },
      status: 0,
      body: undefined,
      ip: '127.0.0.1',
      app: { env: 'test' },
      state: {},
      cookies: {
        set: (name: string, value: string) => {
          cookies.push([name, value]);
        },
      },
    } as unknown as Context;

    const { apiRequestContext, dispose } = container.resolve('openApiRequestContextScope')();
    try {
      await apiRequestContext.authController.setPassword(ctx);
    } finally {
      await dispose();
    }
    return {
      status: ctx.status,
      body: ctx.body as HandlerOutcome['body'],
      cookies,
    };
  };

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

  /** The handler reports domain failures as `ctx.body.error`, a ContractError member. */
  const errorOf = (outcome: HandlerOutcome) => outcome.body.error as ContractError;

  describe('E1 — no verification row', () => {
    it('rejects with InvalidEmailVerificationCode and persists nothing', async () => {
      const email = 'rai76-missing@example.test';

      const outcome = await runSetPassword(baseCreds(email));

      expect(outcome.status).toBe(400);
      expect(errorOf(outcome).equals(ContractError.InvalidEmailVerificationCode)).toBe(true);
      expect(await getUser(email)).toBeUndefined();
      expect(observations).toHaveLength(0);
      // No session is handed out on a failure.
      expect(outcome.cookies).toHaveLength(0);
    });
  });

  describe('E2 — attemptCount >= 3', () => {
    it('rejects with TooManyAttempts, does not consume, does not bump, creates no user', async () => {
      const email = 'rai76-locked@example.test';
      await seedVerification(email, { attemptCount: 3 });

      const outcome = await runSetPassword(baseCreds(email));

      expect(outcome.status).toBe(400);
      expect(errorOf(outcome).equals(ContractError.TooManyAttempts)).toBe(true);
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
    it('rejects and the attemptCount increment PERSISTS across the rollback', async () => {
      const email = 'rai76-badcode@example.test';
      await seedVerification(email, { code: VALID_CODE, attemptCount: 0 });

      const outcome = await runSetPassword(baseCreds(email, { code: '000000' }));

      expect(outcome.status).toBe(400);
      expect(errorOf(outcome).equals(ContractError.InvalidEmailVerificationCode)).toBe(true);
      // The bump is an autocommit gateway OUTSIDE the transaction — it must survive
      // the rollback the controller flags, or the >= 3 lockout can never trigger.
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

      // Invalid phone (too short) makes PendingUser.activate() return InvalidPhoneNumber.
      const outcome = await runSetPassword(baseCreds(email, { phone: '123' }));

      expect(outcome.status).toBe(400);
      expect(errorOf(outcome).equals(ContractError.InvalidPhoneNumber)).toBe(true);
      // This is the fail-as-data rollback: the service RETURNED (it did not throw),
      // so only the controller's flagRollbackOnly stands between this failure and a
      // committed half-activated user.
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
    // The new-user branch creates a PendingUser via PendingUser.create (no id → isNew
    // true, so the row persists) AND calls activate(), flipping userStatus → ACTIVE and
    // setting the password. These tests assert that end state: the new user is saved
    // ACTIVE + password-usable, the verification is consumed atomically, and notify
    // fires AFTER commit.
    it('atomically creates the active user and consumes the verification, notifying AFTER commit', async () => {
      const email = 'rai76-new@example.test';
      await seedVerification(email);

      const outcome = await runSetPassword(baseCreds(email));

      expect(outcome.status).toBe(200);
      expect(outcome.body).toEqual({ message: 'Operation completed successfully', email });

      // Atomic: user persisted AND verification consumed in the same committed transaction.
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

      // The session cookie the FE logs in with. Minted by the controller post-commit,
      // so it is only ever issued over a user that really exists.
      expect(outcome.cookies).toHaveLength(1);
      const [[cookieName, token]] = outcome.cookies;
      expect(cookieName).toBe('token');
      expect(jwt.verify(token, container.resolve('config').jwtSecret)).toMatchObject({
        userId: (user as unknown as { id: string }).id,
        email,
      });
    });

    it('a notify REJECTION does not roll back the committed user (throws post-commit)', async () => {
      const email = 'rai76-new@example.test';
      await seedVerification(email);
      notifyImpl = async () => {
        throw new Error('SES down');
      };

      await expect(runSetPassword(baseCreds(email))).rejects.toThrow('SES down');

      // The user + consumption committed before notify, so they survive the post-commit throw.
      const user = await getUser(email);
      expect(user).toBeDefined();
      expect(statusValue(user?.userStatus)).toBe('ACTIVE');
      const verification = await getVerification(email);
      expect(verification?.consumedAt).toBeDefined();
    });
  });

  describe('E6 — success (existing active user → password reset)', () => {
    it('updates the password and consumes the verification, notifying with passwordChanged', async () => {
      const email = 'rai76-active@example.test';
      const oldHash = await bcrypt.hash('oldPassword1', 12);
      await seedUser(email, { status: 'ACTIVE', passwordHash: oldHash });
      await seedVerification(email);

      const outcome = await runSetPassword(baseCreds(email));

      expect(outcome.status).toBe(200);
      const user = await getUser(email);
      expect(await bcrypt.compare('newPassword9', user.passwordHash!)).toBe(true);
      expect(await bcrypt.compare('oldPassword1', user.passwordHash!)).toBe(false);
      const verification = await getVerification(email);
      expect(verification?.consumedAt).toBeDefined();
      expect(observations).toHaveLength(1);
      expect(observations[0].template).toBe('passwordChanged');
      expect(observations[0].committedUserVisible).toBe(true);
      // The verification is consumed INSIDE the transaction; its being visibly-consumed
      // at notify time proves notify ran AFTER commit (not before).
      expect(observations[0].committedVerificationConsumed).toBe(true);
    });
  });
});
