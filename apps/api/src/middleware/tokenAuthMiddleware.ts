import crypto from 'crypto';
import type { Context, Next } from 'koa';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';
export type TokenAuthMiddleware = (ctx: Context, next: Next) => Promise<void>;
export type OptionalTokenAuthMiddleware = TokenAuthMiddleware;

export const build__TokenAuthMiddleware =
  ({ publicAccessReadService, logger }: IocGeneratedCradle): TokenAuthMiddleware =>
  async (ctx: Context, next: Next) => {
    const token = ctx.getParam.token as string;
    if (!token) {
      logger.warn('Authentication failed: invalid or expired token', {
        method: ctx.method,
        path: ctx.path,
      });
      ctx.status = 401;
      ctx.body = { error: 'Invalid or expired token' };
      return;
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const publicAccess = await publicAccessReadService.publicAccessByTokenHash(hashedToken);
    if (!publicAccess) {
      logger.warn('Authentication failed: invalid or expired token', {
        method: ctx.method,
        path: ctx.path,
      });
    }

    // Add token directly on context for easy access
    ctx.state.publicAccess = publicAccess;

    await next();
  };
