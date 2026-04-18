import type { Context, Next } from 'koa';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type AuthMiddleware = (ctx: Context, next: Next) => Promise<void>;
export type OptionalAuthMiddleware = AuthMiddleware;

export const buildAuthMiddleware =
  ({ authService, logger }: IocGeneratedCradle): AuthMiddleware =>
  async (ctx: Context, next: Next) => {
    const authHeader = ctx.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: missing or invalid authorization header', {
        method: ctx.method,
        path: ctx.path,
        hasHeader: !!authHeader,
      });
      ctx.status = 401;
      ctx.body = { error: 'Authorization header required' };
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await authService.verifyToken(token);
    if (!user) {
      logger.warn('Authentication failed: invalid or expired token', {
        method: ctx.method,
        path: ctx.path,
      });
      ctx.status = 401;
      ctx.body = { error: 'Invalid or expired token' };
      return;
    }

    // Add user directly on context for easy access
    ctx.state.user = user;
    ctx.state.isLoggedIn = true;

    await next();
  };

export const buildOptionalAuthMiddleware =
  ({ authService }: IocGeneratedCradle): OptionalAuthMiddleware =>
  async (ctx: Context, next: Next) => {
    const authHeader = ctx.get('Authorization');
    ctx.isLoggedIn = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);
      if (user) {
        ctx.state.user = user;
        ctx.state.isLoggedIn = true;
      }
    }
    await next();
  };
