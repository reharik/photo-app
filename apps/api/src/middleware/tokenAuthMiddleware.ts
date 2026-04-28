import type { Context, Next } from 'koa';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type TokenAuthMiddleware = (ctx: Context, next: Next) => Promise<void>;
export type OptionalTokenAuthMiddleware = TokenAuthMiddleware;

export const buildTokenAuthMiddleware =
  ({ authService, logger }: IocGeneratedCradle): TokenAuthMiddleware =>
  async (ctx: Context, next: Next) => {
    const token = ctx.getParam.token;

    const hashedToken = await authService.verifyJWTToken(token);
    if (!hashedToken) {
      logger.warn('Authentication failed: invalid or expired token', {
        method: ctx.method,
        path: ctx.path,
      });
      ctx.status = 401;
      ctx.body = { error: 'Invalid or expired token' };
      return;
    }

    // Add user directly on context for easy access
    ctx.state.hashedToken = hashedToken;

    await next();
  };
