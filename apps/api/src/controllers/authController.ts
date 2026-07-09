import { type User } from '@packages/contracts';
import type { Logger, RateLimiter } from '@packages/infrastructure';
import type { Context } from 'koa';

import type { AuthService } from '../services/authService.js';

export interface AuthController {
  login: (ctx: Context) => Promise<Context>;
  logout: (ctx: Context) => Context;
  emailVerification: (ctx: Context) => Promise<Context>;
  setPassword: (ctx: Context) => Promise<Context>;
  me: (ctx: Context) => Context;
  publicAccess: (ctx: Context) => Context;
}

type AuthControllerDeps = {
  authService: AuthService;
  logger: Logger;
  rateLimiter: RateLimiter;
};

export const build__AuthController = ({
  authService,
  logger,
  rateLimiter,
}: AuthControllerDeps): AuthController => ({
  login: async (ctx: Context): Promise<Context> => {
    const { email, password } = ctx.request.body as {
      email: string;
      password: string;
    };
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      ctx.status = 400;
      ctx.body = { error: 'Email and password are required' };
      return ctx;
    }

    const loginCheck = await rateLimiter.consume('login:attempt', normalizedEmail, {
      limit: 5,
      windowMs: 15 * 60_000,
    });
    if (!loginCheck.allowed) {
      logger.warn('Login rate limiter triggered!', {
        normalizedEmail,
        ip: ctx.ip,
      });
      ctx.status = 400;
      ctx.body = { error: 'Too many attempts' };
      return ctx; // silently skip. no code sent. blind 200 still returned by controller.
    }

    const result = await authService.login({ email: normalizedEmail, password });
    if (!result) {
      logger.warn('Login attempt failed from controller', {
        normalizedEmail,
        ip: ctx.ip,
      });
      ctx.status = 401;
      ctx.body = { error: 'Invalid email or password' };
      return ctx;
    }

    logger.info('Login successful from controller', {
      userId: result.user.id,
      email: result.user.email,
      ip: ctx.ip,
    });

    ctx.cookies.set('token', result.token, {
      httpOnly: true,
      secure: ctx.app.env === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    ctx.status = 200;
    ctx.body = {
      user: result.user,
    };
    return ctx;
  },

  logout: (ctx: Context): Context => {
    // Match login cookie attributes so the browser actually clears the session cookie
    // (path/sameSite/secure must align or the old cookie may keep being sent on GraphQL refetch).
    ctx.cookies.set('token', '', {
      httpOnly: true,
      secure: ctx.app.env === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    ctx.status = 200;
    ctx.body = { message: 'Logged out successfully' };
    return ctx;
  },

  emailVerification: async (ctx: Context): Promise<Context> => {
    const { email } = ctx.request.body as { email: string };
    const normalizedEmail = email.trim().toLowerCase();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmail = EMAIL_RE.test(normalizedEmail);

    if (!normalizedEmail || !validEmail) {
      logger.warn('Email verification attempt failed from controller', {
        normalizedEmail,
        ip: ctx.ip,
      });
      ctx.status = 200;
      ctx.body = { message: 'We have sent you an email with a verification code.' };
      return ctx;
    }

    const byIp = await rateLimiter.consume('email_verification:issue', ctx.ip, {
      limit: 30,
      windowMs: 15 * 60_000,
    });
    const byEmail = await rateLimiter.consume('email_verification:email', normalizedEmail, {
      limit: 5,
      windowMs: 15 * 60_000,
    });
    if (!byIp.allowed || !byEmail.allowed) {
      logger.warn('Email verification rate limiter triggered!', {
        normalizedEmail,
        ip: ctx.ip,
      });
      ctx.status = 200;
      ctx.body = { message: 'We have sent you an email with a verification code.' };
      return ctx; // silently skip. no code sent. blind 200 still returned by controller.
    }

    await authService.verifyEmail(normalizedEmail);

    ctx.status = 200;
    ctx.body = { message: 'We have sent you an email with a verification code.' };
    return ctx;
  },

  setPassword: async (ctx: Context): Promise<Context> => {
    const body = ctx.request.body as {
      email?: unknown;
      password?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      phone?: unknown;
      smsOptIn?: unknown;
      code?: unknown;
    };

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    const phoneRaw = typeof body.phone === 'string' ? body.phone.trim() : '';
    const phone = phoneRaw.length > 0 ? phoneRaw : undefined;
    const smsOptIn = typeof body.smsOptIn === 'boolean' ? body.smsOptIn : false;

    if (code.length === 0 || email.length === 0 || password.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'Email, password, and code are required' };
      return ctx;
    }

    if (password.length < 8) {
      ctx.status = 400;
      ctx.body = { error: 'Password must be at least 8 characters long' };
      return ctx;
    }

    const result = await authService.verifyCodeAndSetPassword({
      email,
      password,
      code,
      firstName,
      lastName,
      phone,
      smsOptIn,
    });

    if (!result.success) {
      logger.warn('Set password attempt failed from controller', {
        email,
        ip: ctx.ip,
      });
      ctx.status = 400;
      // reason.error will be "INVALID_CODE", "EXPIRED", "TOO_MANY_ATTEMPTS"
      ctx.body = { error: result.error };
      return ctx;
    }

    ctx.cookies.set('token', result.value.token, {
      httpOnly: true,
      secure: ctx.app.env === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Operation completed successfully',
      email,
    };
    return ctx;
  },

  me: (ctx: Context): Context => {
    // This endpoint requires authentication middleware
    const user = ctx.state.user;

    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'Not authenticated' };
      return ctx;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...sanitized } = user as User & { passwordHash?: string };
    ctx.status = 200;
    ctx.body = { user: sanitized };
    return ctx;
  },

  publicAccess: (ctx: Context): Context => {
    const publicAccessId = ctx.state.publicAccessId;

    if (!publicAccessId) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'A public access token is required' };
      return ctx;
    }

    logger.info('Public access successful from controller', {
      ip: ctx.ip,
    });

    ctx.body = { success: true };
    ctx.status = 200;
    return ctx;
  },
});
