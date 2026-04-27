import { type User } from '@packages/contracts';
import type { Context } from 'koa';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export interface AuthController {
  login: (ctx: Context) => Promise<Context>;
  signup: (ctx: Context) => Promise<Context>;
  logout: (ctx: Context) => Context;
  me: (ctx: Context) => Context;
}

export const buildAuthController = ({
  authService,
  logger,
}: IocGeneratedCradle): AuthController => ({
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
      name?: unknown;
    };

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (email.length === 0 || password.length === 0 || name.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'Email, password, and name are required' };
      return ctx;
    }

    // Validate password length
    if (password.length < 8) {
      ctx.status = 400;
      ctx.body = { error: 'Password must be at least 8 characters long' };
      return ctx;
    }

    const result = await authService.signup({
      email,
      password,
      name,
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
});
