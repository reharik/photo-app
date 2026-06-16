import { ContractError, type User } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type { Context } from 'koa';

import type { AuthService } from '../services/authService.js';

export interface AuthController {
  login: (ctx: Context) => Promise<Context>;
  signup: (ctx: Context) => Promise<Context>;
  logout: (ctx: Context) => Context;
  forgotPassword: (ctx: Context) => Promise<Context>;
  resetPassword: (ctx: Context) => Promise<Context>;
  me: (ctx: Context) => Context;
  publicAccess: (ctx: Context) => Context;
}

type AuthControllerDeps = {
  authService: AuthService;
  logger: Logger;
};

export const build__AuthController = ({
  authService,
  logger,
}: AuthControllerDeps): AuthController => ({
  login: async (ctx: Context): Promise<Context> => {
    const { email, password } = ctx.request.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      ctx.status = 400;
      ctx.body = { error: 'Email and password are required' };
      return ctx;
    }

    const result = await authService.login({ email, password });
    if (!result) {
      logger.warn('Login attempt failed from controller', {
        email,
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

  signup: async (ctx: Context): Promise<Context> => {
    const body = ctx.request.body as {
      email?: unknown;
      password?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      phone?: unknown;
      smsOptIn?: unknown;
    };

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    const phoneRaw = typeof body.phone === 'string' ? body.phone.trim() : '';
    const phone = phoneRaw.length > 0 ? phoneRaw : undefined;
    const smsOptIn = typeof body.smsOptIn === 'boolean' ? body.smsOptIn : false;
    if (
      email.length === 0 ||
      password.length === 0 ||
      firstName.length === 0 ||
      lastName.length === 0
    ) {
      ctx.status = 400;
      ctx.body = { error: 'Email, password, first name, and last name are required' };
      return ctx;
    }

    if (password.length < 8) {
      ctx.status = 400;
      ctx.body = { error: 'Password must be at least 8 characters long' };
      return ctx;
    }

    if (phone !== undefined) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        ctx.status = 400;
        ctx.body = { error: 'Enter a valid phone number or leave the field blank' };
        return ctx;
      }
    }

    const result = await authService.signup({
      email,
      password,
      firstName,
      lastName,
      phone,
      smsOptIn,
    });
    if (!result) {
      logger.warn('Signup attempt failed from controller', {
        email,
        ip: ctx.ip,
      });
      ctx.status = 409;
      ctx.body = { error: 'An account with this email already exists' };
      return ctx;
    }

    logger.info('Signup successful from controller', {
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

    ctx.status = 201;
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

  forgotPassword: async (ctx: Context): Promise<Context> => {
    const { email } = ctx.request.body as { email: string };
    if (!email) {
      logger.warn('Forgot password attempt failed from controller', {
        email,
        ip: ctx.ip,
      });
      ctx.status = 200;
      ctx.body = { message: "If an account exists for that email, we've sent a reset code." };
      return ctx;
    }

    await authService.forgotPassword(email);

    ctx.status = 200;
    ctx.body = { message: "If an account exists for that email, we've sent a reset code." };
    return ctx;
  },

  resetPassword: async (ctx: Context): Promise<Context> => {
    const { email, password, code } = ctx.request.body as {
      email: string;
      password: string;
      code: string;
    };
    if (!email || !password || !code) {
      ctx.status = 400;
      ctx.body = { error: 'Email, password, and code are required' };
      return ctx;
    }

    if (password.length < 8) {
      ctx.status = 400;
      ctx.body = { error: 'Password must be at least 8 characters long' };
      return ctx;
    }

    const result = await authService.resetPassword(email, password, code);
    if (!result.success) {
      logger.error(result.error.code);
      const status = result.error.equals(ContractError.TooManyAttempts) ? 429 : 400;
      ctx.status = status;
      ctx.body = { error: result.error.display };
      return ctx;
    }
    ctx.status = 200;
    ctx.body = { message: 'Password reset successfully' };
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
