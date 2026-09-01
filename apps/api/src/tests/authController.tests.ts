/**
 * RAI-76: Rewritten for the post-refactor controller. The old
 * forgotPassword/resetPassword handlers are gone; the controller now exposes
 * login, logout, emailVerification, setPassword, me, publicAccess and depends on
 * `authQueryService` (login/verifyEmail), a `rateLimiter`, and the generated
 * `openAuthServiceScope` opener (setPassword opens the AuthService scope root,
 * starts it, and disposes it in a finally). These are unit tests: the opener and
 * the services behind it are faked, so no container is involved at all. The real
 * DB behavior of verifyCodeAndSetPassword is covered in the integration tests.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContractError, fail, ok } from '@packages/contracts';
import type { Logger, RateLimiter, RateLimitResult } from '@packages/infrastructure';
import type { Context } from 'koa';

import { build__AuthController } from '../controllers/authController.js';
import type { OpenAuthServiceScope } from '../di/generated/ioc-registry.types.js';
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

describe('build__AuthController', () => {
  let authQueryService: jest.Mocked<AuthQueryService>;
  let rateLimiter: jest.Mocked<RateLimiter>;
  let authService: jest.Mocked<AuthService>;
  let dispose: jest.Mock<() => Promise<void>>;
  let authController: ReturnType<typeof build__AuthController>;

  beforeEach(() => {
    authQueryService = {
      login: jest.fn<AuthQueryService['login']>(),
      verifyEmail: jest.fn<AuthQueryService['verifyEmail']>(),
      hashPassword: jest.fn<AuthQueryService['hashPassword']>(),
    };
    rateLimiter = {
      consume: jest.fn<RateLimiter['consume']>().mockResolvedValue(allowed),
    };
    // AuthService is scope-rooted: it has no root-cradle key, so there is nothing to
    // resolve. There is no `start` any more — the uow joins lazily on the first
    // repository call — so the only boundary verb the controller drives is
    // `settle`, which delegates to the scope's own uow.settle.
    authService = {
      verifyCodeAndSetPassword: jest.fn<AuthService['verifyCodeAndSetPassword']>(),
      settle: jest.fn<AuthService['settle']>(async () => undefined),
    };
    dispose = jest.fn<() => Promise<void>>(async () => undefined);

    // Fake opener: zero-arg (the AuthService root declares an empty lbv set), hands
    // back the faked service over a no-op scope bracket. Structurally typed against
    // the generated alias — no casts.
    const openAuthServiceScope: OpenAuthServiceScope = () => ({ authService, dispose });

    authController = build__AuthController({
      authQueryService,
      openAuthServiceScope,
      logger,
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
    });

    it('returns 400 when the login rate limit is exceeded', async () => {
      rateLimiter.consume.mockResolvedValueOnce(denied);
      const ctx = createCtx({ email: 'User@Example.test', password: 'secret123' });
      await authController.login(ctx);
      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({ error: 'Too many attempts' });
      expect(authQueryService.login).not.toHaveBeenCalled();
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
    });

    it('returns a generic 200 without issuing a code when rate limited', async () => {
      rateLimiter.consume.mockResolvedValueOnce(allowed).mockResolvedValueOnce(denied);
      const ctx = createCtx({ email: 'user@example.test' });
      await authController.emailVerification(ctx);
      expect(ctx.status).toBe(200);
      expect(authQueryService.verifyEmail).not.toHaveBeenCalled();
    });

    it('issues a verification code for a valid, non-throttled email', async () => {
      authQueryService.verifyEmail.mockResolvedValue(ok(undefined));
      const ctx = createCtx({ email: '  User@Example.test  ' });
      await authController.emailVerification(ctx);
      expect(authQueryService.verifyEmail).toHaveBeenCalledWith('user@example.test');
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
    });

    it('returns 400 when the password is too short', async () => {
      const ctx = createCtx({ email: 'user@example.test', password: 'short', code: '123456' });
      await authController.setPassword(ctx);
      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({ error: 'Password must be at least 8 characters long' });
      expect(authService.verifyCodeAndSetPassword).not.toHaveBeenCalled();
    });

    it('opens the authService scope, settles it, and returns 400 on a domain failure', async () => {
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
      // The service returns from its failure paths without settling, so the
      // controller's finally is the only thing that rolls the request back.
      expect(authService.settle).toHaveBeenCalledWith(false);
      // The controller's finally must tear the scope down even on the failure path.
      expect(dispose).toHaveBeenCalledTimes(1);
      expect(authService.verifyCodeAndSetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.test',
          password: 'newPassword9',
          code: '000000',
          firstName: 'Given',
          lastName: 'Family',
        }),
      );
      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({ error: ContractError.InvalidEmailVerificationCode });
    });

    it('sets the auth cookie and returns 200 on success', async () => {
      authService.verifyCodeAndSetPassword.mockResolvedValue(ok({ token: 'session-jwt' }));
      const ctx = createCtx({
        email: 'user@example.test',
        password: 'newPassword9',
        code: '123456',
      });
      await authController.setPassword(ctx);
      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({
        message: 'Operation completed successfully',
        email: 'user@example.test',
      });
      expect(cookieSetOf(ctx)).toHaveBeenCalledWith(
        'token',
        'session-jwt',
        expect.objectContaining({ httpOnly: true }),
      );
      // settle(false) runs on the success path too — it is inert once the service
      // has already committed, so the controller does not have to branch on it.
      expect(authService.settle).toHaveBeenCalledWith(false);
      expect(dispose).toHaveBeenCalledTimes(1);
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
