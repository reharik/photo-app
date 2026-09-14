/**
 * RAI-76: Rewritten for the post-refactor controller. The old
 * forgotPassword/resetPassword handlers are gone; the controller now exposes
 * login, logout, emailVerification, setPassword, me, publicAccess.
 *
 * Boundary shape (as of the worker-core split): the controller is itself
 * request-scoped and owns the transaction boundary directly — every handler that
 * touches the database wraps its work in `uow.inTransaction(...)`. There is no
 * `openAuthServiceScope` opener any more, and `AuthService` no longer exposes a
 * lifecycle verb of its own; it is a plain scoped collaborator that signals
 * failure as data, and the controller flags rollback on it.
 *
 * The two things that must happen OUTSIDE the boundary are the JWT mint and the
 * email send, both of which moved from `AuthService` up into this controller so
 * they land post-commit. That ordering is the load-bearing assertion in the
 * setPassword cases below.
 *
 * These are unit tests: the services and the uow are faked, so no container is
 * involved. The real DB behavior is covered in the integration tests.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContractError, fail, ok } from '@packages/contracts';
import type { Logger, RateLimiter, RateLimitResult } from '@packages/infrastructure';
import type { UnitOfWork } from '@packages/media-core';
import type { NotificationService } from '@packages/notifications';
import jwt from 'jsonwebtoken';
import type { Context } from 'koa';

import type { Config } from '../config.js';
import { build__AuthController } from '../controllers/authController.js';
import type { AuthQueryService } from '../services/authQueryService.js';
import type { AuthService } from '../services/authService.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
} satisfies Logger;

const allowed: RateLimitResult = { allowed: true, remaining: 4, retryAfterMs: null };
const denied: RateLimitResult = { allowed: false, remaining: 0, retryAfterMs: 60_000 };

const jwtSecret = 'unit-test-secret';
const config = {
  jwtSecret,
  jwtExpiresIn: '30d',
  clientUrl: 'https://app.test',
} as unknown as Config;

const createCtx = (body: Record<string, unknown>, state: Record<string, unknown> = {}): Context => {
  return {
    request: { body },
    status: 0,
    body: undefined,
    ip: '127.0.0.1',
    app: { env: 'test' },
    state,
    cookies: { set: jest.fn() },
  } as unknown as Context;
};

// `ctx.cookies.set` is typed as a Koa Cookies method, so referencing it directly
// trips @typescript-eslint/unbound-method. Read it through a plain-function shape.
const cookieSetOf = (ctx: Context): jest.Mock => (ctx.cookies as unknown as { set: jest.Mock }).set;

/**
 * A stateful uow fake, deliberately faithful about the one property these tests
 * are about: work handed to `inTransaction` runs INSIDE the boundary, and
 * anything the controller does after it returns runs outside. `trace` records
 * that ordering so a regression that moves the JWT mint or the email send back
 * inside the transaction is caught rather than merely tolerated.
 *
 * `db()` throws outside a boundary, matching the real uow — a handler that
 * forgot its `inTransaction` fails loudly here instead of silently passing.
 */
const createFakeUow = () => {
  const trace: string[] = [];
  let open = false;
  let rollbackFlagged = false;
  const uow = {
    id: 'fake-uow',
    start: async () => {
      if (open) throw new Error('Transaction already open when start called');
      open = true;
      trace.push('start');
    },
    db: () => {
      if (!open) throw new Error('Transaction not started');
      return {} as ReturnType<UnitOfWork['db']>;
    },
    complete: async (ok: boolean) => {
      if (!open) throw new Error('Transaction not started');
      open = false;
      trace.push(!ok || rollbackFlagged ? 'rollback' : 'commit');
      rollbackFlagged = false;
    },
    collectEvents: () => undefined,
    flagRollbackOnly: () => {
      rollbackFlagged = true;
      trace.push('flagRollbackOnly');
    },
    inTransaction: async <T>(fn: () => Promise<T>): Promise<T> => {
      await uow.start();
      try {
        const result = await fn();
        await uow.complete(true);
        return result;
      } catch (e) {
        await uow.complete(false);
        throw e;
      }
    },
  } satisfies UnitOfWork;
  return { uow, trace, isOpen: () => open };
};

describe('build__AuthController', () => {
  let authQueryService: jest.Mocked<AuthQueryService>;
  let rateLimiter: jest.Mocked<RateLimiter>;
  let authService: jest.Mocked<AuthService>;
  let notificationService: jest.Mocked<NotificationService>;
  let fakeUow: ReturnType<typeof createFakeUow>;
  let authController: ReturnType<typeof build__AuthController>;

  beforeEach(() => {
    jest.clearAllMocks();
    authQueryService = {
      login: jest.fn<AuthQueryService['login']>(),
      verifyEmail: jest.fn<AuthQueryService['verifyEmail']>(),
      hashPassword: jest.fn<AuthQueryService['hashPassword']>(),
    };
    rateLimiter = {
      consume: jest.fn<RateLimiter['consume']>().mockResolvedValue(allowed),
    };
    authService = {
      verifyCodeAndSetPassword: jest.fn<AuthService['verifyCodeAndSetPassword']>(),
    };
    notificationService = {
      notify: jest.fn<NotificationService['notify']>().mockResolvedValue(ok('message-id')),
    };
    fakeUow = createFakeUow();

    authController = build__AuthController({
      authQueryService,
      authService,
      notificationService,
      uow: fakeUow.uow,
      config,
      scopedLogger: logger,
      rateLimiter,
    });
  });

  describe('login', () => {
    it('returns 400 when email or password is missing', async () => {
      const ctx = createCtx({ email: '', password: '' });
      await authController.login(ctx);
      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({ error: 'Email and password are required' });
      expect(authQueryService.login).not.toHaveBeenCalled();
      // Rejected before any database work, so no transaction should have been opened.
      expect(fakeUow.trace).toEqual([]);
    });

    it('returns 400 when the login rate limit is exceeded', async () => {
      rateLimiter.consume.mockResolvedValueOnce(denied);
      const ctx = createCtx({ email: 'User@Example.test', password: 'secret123' });
      await authController.login(ctx);
      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({ error: 'Too many attempts' });
      expect(authQueryService.login).not.toHaveBeenCalled();
      expect(fakeUow.trace).toEqual([]);
    });

    it('returns 401 for invalid credentials', async () => {
      authQueryService.login.mockResolvedValue(undefined);
      const ctx = createCtx({ email: 'User@Example.test', password: 'wrong' });
      await authController.login(ctx);
      expect(authQueryService.login).toHaveBeenCalledWith({
        email: 'user@example.test',
        password: 'wrong',
      });
      expect(ctx.status).toBe(401);
      expect(ctx.body).toEqual({ error: 'Invalid email or password' });
      // A miss is not an error: the lookup's transaction still closes cleanly.
      expect(fakeUow.trace).toEqual(['start', 'commit']);
    });

    it('sets the auth cookie and returns 200 with the user on success', async () => {
      const user = {
        id: 'u1',
        email: 'user@example.test',
        firstName: 'user',
        lastName: 'name',
        isActive: true,
        displayName: 'User',
        isAuthenticated: true,
      };
      authQueryService.login.mockResolvedValue({ user, token: 'jwt-token' });
      const ctx = createCtx({ email: 'user@example.test', password: 'secret123' });
      await authController.login(ctx);
      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({ user });
      expect(cookieSetOf(ctx)).toHaveBeenCalledWith(
        'token',
        'jwt-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(fakeUow.trace).toEqual(['start', 'commit']);
    });
  });

  describe('logout', () => {
    it('clears the cookie and returns 200', () => {
      const ctx = createCtx({});
      authController.logout(ctx);
      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({ message: 'Logged out successfully' });
      expect(cookieSetOf(ctx)).toHaveBeenCalledWith(
        'token',
        '',
        expect.objectContaining({ maxAge: 0 }),
      );
    });
  });

  describe('emailVerification', () => {
    it('returns a generic 200 without issuing a code for an invalid email', async () => {
      const ctx = createCtx({ email: 'not-an-email' });
      await authController.emailVerification(ctx);
      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({
        message: 'We have sent you an email with a verification code.',
      });
      expect(authQueryService.verifyEmail).not.toHaveBeenCalled();
      expect(notificationService.notify).not.toHaveBeenCalled();
    });

    it('returns a generic 200 without issuing a code when rate limited', async () => {
      rateLimiter.consume.mockResolvedValueOnce(allowed).mockResolvedValueOnce(denied);
      const ctx = createCtx({ email: 'user@example.test' });
      await authController.emailVerification(ctx);
      expect(ctx.status).toBe(200);
      expect(authQueryService.verifyEmail).not.toHaveBeenCalled();
      expect(notificationService.notify).not.toHaveBeenCalled();
    });

    it('issues a verification code for a valid, non-throttled email and emails it post-commit', async () => {
      authQueryService.verifyEmail.mockResolvedValue(ok('123456'));
      const ctx = createCtx({ email: '  User@Example.test  ' });
      await authController.emailVerification(ctx);
      expect(authQueryService.verifyEmail).toHaveBeenCalledWith('user@example.test');
      // The code is persisted and committed BEFORE the email goes out — an email
      // carrying a code that was then rolled back would be unredeemable.
      expect(fakeUow.trace).toEqual(['start', 'commit']);
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          to: { email: 'user@example.test' },
          template: 'verificationCode',
          data: { code: '123456' },
        }),
      );
      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({
        message: 'We have sent you an email with a verification code.',
      });
    });

    it('still returns the generic 200 when the code email fails to send', async () => {
      authQueryService.verifyEmail.mockResolvedValue(ok('123456'));
      notificationService.notify.mockResolvedValue(fail(ContractError.noRecipientsProvided));
      const ctx = createCtx({ email: 'user@example.test' });
      await authController.emailVerification(ctx);
      // Best-effort: the send failure is logged, not surfaced, and never undoes
      // the committed code.
      expect(fakeUow.trace).toEqual(['start', 'commit']);
      expect(ctx.status).toBe(200);
      expect(logger.error).toHaveBeenCalledWith(
        'Verification code email failed',
        expect.any(Object),
      );
    });

    it('does not email anything when the code could not be issued', async () => {
      authQueryService.verifyEmail.mockResolvedValue(fail(ContractError.UserNotFound));
      const ctx = createCtx({ email: 'user@example.test' });
      await authController.emailVerification(ctx);
      expect(notificationService.notify).not.toHaveBeenCalled();
      // Still a blind 200 — the endpoint must not disclose whether the email exists.
      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({
        message: 'We have sent you an email with a verification code.',
      });
    });
  });

  describe('setPassword', () => {
    it('returns 400 when email, password, or code is missing', async () => {
      const ctx = createCtx({ email: 'user@example.test', password: 'newPassword9' });
      await authController.setPassword(ctx);
      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({ error: 'Email, password, and code are required' });
      expect(authService.verifyCodeAndSetPassword).not.toHaveBeenCalled();
      expect(fakeUow.trace).toEqual([]);
    });

    it('returns 400 when the password is too short', async () => {
      const ctx = createCtx({ email: 'user@example.test', password: 'short', code: '123456' });
      await authController.setPassword(ctx);
      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({ error: 'Password must be at least 8 characters long' });
      expect(authService.verifyCodeAndSetPassword).not.toHaveBeenCalled();
      expect(fakeUow.trace).toEqual([]);
    });

    it('flags rollback and returns 400 on a domain failure', async () => {
      authService.verifyCodeAndSetPassword.mockResolvedValue(
        fail(ContractError.InvalidEmailVerificationCode),
      );
      const ctx = createCtx({
        email: 'user@example.test',
        password: 'newPassword9',
        code: '000000',
        firstName: 'Given',
        lastName: 'Family',
      });
      await authController.setPassword(ctx);
      // Fail-as-data: the service returns normally, so `inTransaction` would
      // otherwise commit. `flagRollbackOnly` is what turns that into a rollback,
      // and it must land before the boundary closes.
      expect(fakeUow.trace).toEqual(['start', 'flagRollbackOnly', 'rollback']);
      expect(authService.verifyCodeAndSetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.test',
          password: 'newPassword9',
          code: '000000',
          firstName: 'Given',
          lastName: 'Family',
        }),
      );
      // Nothing was committed, so nothing is announced and no session is minted.
      expect(notificationService.notify).not.toHaveBeenCalled();
      expect(cookieSetOf(ctx)).not.toHaveBeenCalled();
      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({ error: ContractError.InvalidEmailVerificationCode });
    });

    it('commits, then mints the session JWT and emails the user, and returns 200', async () => {
      authService.verifyCodeAndSetPassword.mockResolvedValue(
        ok({ userId: 'u1', template: 'welcome' }),
      );
      const ctx = createCtx({
        email: 'user@example.test',
        password: 'newPassword9',
        code: '123456',
        firstName: 'Given',
        lastName: 'Family',
      });
      await authController.setPassword(ctx);

      // The commit happens before the notify. This is the whole reason the JWT
      // mint and the send moved out of AuthService and up here: SES latency must
      // not hold a transaction open, and an SES failure must not undo the signup.
      expect(fakeUow.trace).toEqual(['start', 'commit']);
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          to: { email: 'user@example.test' },
          template: 'welcome',
          data: expect.objectContaining({ firstName: 'Given', lastName: 'Family' }),
        }),
      );

      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({
        message: 'Operation completed successfully',
        email: 'user@example.test',
      });

      // The cookie carries a real signed token now (the controller mints it), so
      // assert on the token rather than a stubbed string.
      expect(cookieSetOf(ctx)).toHaveBeenCalledWith(
        'token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
      const [, token] = cookieSetOf(ctx).mock.calls[0] as [string, string, unknown];
      expect(jwt.verify(token, jwtSecret)).toMatchObject({
        userId: 'u1',
        email: 'user@example.test',
      });
    });

    it('uses the passwordChanged template when the service reports a reset', async () => {
      authService.verifyCodeAndSetPassword.mockResolvedValue(
        ok({ userId: 'u2', template: 'passwordChanged' }),
      );
      const ctx = createCtx({
        email: 'existing@example.test',
        password: 'newPassword9',
        code: '123456',
      });
      await authController.setPassword(ctx);
      expect(ctx.status).toBe(200);
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'passwordChanged' }),
      );
    });

    it('still returns 200 and sets the cookie when the welcome email fails', async () => {
      authService.verifyCodeAndSetPassword.mockResolvedValue(
        ok({ userId: 'u1', template: 'welcome' }),
      );
      notificationService.notify.mockResolvedValue(fail(ContractError.noRecipientsProvided));
      const ctx = createCtx({
        email: 'user@example.test',
        password: 'newPassword9',
        code: '123456',
      });
      await authController.setPassword(ctx);
      // The account is already committed; a send failure is logged and the user
      // is still logged in.
      expect(fakeUow.trace).toEqual(['start', 'commit']);
      expect(ctx.status).toBe(200);
      expect(cookieSetOf(ctx)).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('Failed to send welcome email', expect.any(Object));
    });
  });

  describe('me', () => {
    it('returns 401 when there is no authenticated user', () => {
      const ctx = createCtx({});
      authController.me(ctx);
      expect(ctx.status).toBe(401);
      expect(ctx.body).toEqual({ error: 'Not authenticated' });
    });

    it('returns the sanitized user (no passwordHash) when authenticated', () => {
      const ctx = createCtx(
        {},
        { user: { id: 'u1', email: 'user@example.test', passwordHash: 'secret-hash' } },
      );
      authController.me(ctx);
      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({ user: { id: 'u1', email: 'user@example.test' } });
    });
  });

  describe('publicAccess', () => {
    it('returns 400 when no public access token is present', () => {
      const ctx = createCtx({});
      authController.publicAccess(ctx);
      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({ success: false, error: 'A public access token is required' });
    });

    it('returns 200 when a public access id is present on state', () => {
      const ctx = createCtx({}, { publicAccessId: 'pub-1' });
      authController.publicAccess(ctx);
      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({ success: true });
    });
  });
});
