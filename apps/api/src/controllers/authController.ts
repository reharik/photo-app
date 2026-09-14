import { EntityId, type User } from '@packages/contracts';
import {
  RequestScopeLifeCycle,
  type RateLimiter,
  type ScopedLogger,
} from '@packages/infrastructure';
import jwt from 'jsonwebtoken';
import type { Context } from 'koa';

import { UnitOfWork } from '@packages/media-core';
import { NotificationService } from '@packages/notifications';
import { Config } from '../config';
import type { AuthQueryService } from '../services/authQueryService';
import { AuthService } from '../services/authService';

export interface AuthController extends RequestScopeLifeCycle {
  login: (ctx: Context) => Promise<Context>;
  logout: (ctx: Context) => Context;
  emailVerification: (ctx: Context) => Promise<Context>;
  setPassword: (ctx: Context) => Promise<Context>;
  me: (ctx: Context) => Context;
  publicAccess: (ctx: Context) => Context;
}

type AuthControllerDeps = {
  authQueryService: AuthQueryService;
  scopedLogger: ScopedLogger;
  rateLimiter: RateLimiter;
  authService: AuthService;
  uow: UnitOfWork;
  config: Config;
  notificationService: NotificationService;
};

export const build__AuthController = ({
  authQueryService,
  scopedLogger,
  rateLimiter,
  authService,
  uow,
  config,
  notificationService,
}: AuthControllerDeps): AuthController => {
  const notifyUser = async (
    id: EntityId,
    email: string,
    firstName: string,
    lastName: string,
    template: 'welcome' | 'passwordChanged',
  ): Promise<string> => {
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: id,
        email: email,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions,
    );
    const result = await notificationService.notify({
      to: { email },
      channels: ['email'],
      template,
      data: {
        firstName: firstName,
        lastName: lastName,
        appUrl: config.clientUrl,
        changedAt: new Date().toISOString(),
      },
    });

    if (result.success) {
      scopedLogger.info('User signed up successfully', {
        userId: id,
        email: email,
      });
    } else {
      scopedLogger.error('Failed to send welcome email', {
        userId: id,
        email: email,
        error: result.error.display,
      });
    }
    return token;
  };

  return {
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
        scopedLogger.warn('Login rate limiter triggered!', {
          normalizedEmail,
          ip: ctx.ip,
        });
        ctx.status = 400;
        ctx.body = { error: 'Too many attempts' };
        return ctx; // silently skip. no code sent. blind 200 still returned by controller.
      }

      const result = await uow.inTransaction(() =>
        authQueryService.login({ email: normalizedEmail, password }),
      );
      if (!result) {
        scopedLogger.warn('Login attempt failed from controller', {
          normalizedEmail,
          ip: ctx.ip,
        });
        ctx.status = 401;
        ctx.body = { error: 'Invalid email or password' };
        return ctx;
      }

      scopedLogger.info('Login successful from controller', {
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
        scopedLogger.warn('Email verification attempt failed from controller', {
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
        scopedLogger.warn('Email verification rate limiter triggered!', {
          normalizedEmail,
          ip: ctx.ip,
        });
        ctx.status = 200;
        ctx.body = { message: 'We have sent you an email with a verification code.' };
        return ctx; // silently skip. no code sent. blind 200 still returned by controller.
      }

      const verified = await uow.inTransaction(() => authQueryService.verifyEmail(normalizedEmail));
      if (verified.success) {
        const sent = await notificationService.notify({
          to: { email: normalizedEmail },
          channels: ['email'],
          template: 'verificationCode',
          data: { code: verified.value },
        });
        if (!sent.success) {
          scopedLogger.error('Verification code email failed', {
            email: normalizedEmail,
            error: sent.error.display,
          });
        }
      }

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

      const result = await uow.inTransaction(async () => {
        const r = await authService.verifyCodeAndSetPassword({
          email,
          password,
          code,
          firstName,
          lastName,
          phone,
          smsOptIn,
        });
        if (!r.success) uow.flagRollbackOnly();
        return r;
      });

      if (!result.success) {
        scopedLogger.warn('Set password attempt failed from controller', {
          email,
          ip: ctx.ip,
        });
        ctx.status = 400;
        // reason.error will be "INVALID_CODE", "EXPIRED", "TOO_MANY_ATTEMPTS"
        ctx.body = { error: result.error };
        return ctx;
      }
      // Post-commit, best-effort: emailing the user must not affect the committed
      // write, and a failure here must not roll the transaction back (already committed).
      const token = await notifyUser(
        result.value.userId,
        email,
        firstName,
        lastName,
        result.value.template,
      );

      ctx.cookies.set('token', token, {
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
      const { passwordHash: _passwordHash, ...sanitized } = user as User & {
        passwordHash?: string;
      };
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

      scopedLogger.info('Public access successful from controller', {
        ip: ctx.ip,
      });

      ctx.body = { success: true };
      ctx.status = 200;
      return ctx;
    },
  };
};
