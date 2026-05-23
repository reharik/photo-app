import { hashToken } from '@packages/media-core';
import type { Context, Next } from 'koa';
import type { AppCradle } from '../di/generated/ioc-composed.js';
export type TokenHandshakeMiddleware = (ctx: Context, next: Next) => Promise<void>;

export const build__TokenHandshakeMiddleware =
  ({ publicAccessReadService, logger }: AppCradle): TokenHandshakeMiddleware =>
  async (ctx: Context, next: Next) => {
    const body = ctx.request.body as { token: string };
    const token = body.token;
    const hashedToken = hashToken(token);
    const publicAccessId = await publicAccessReadService.validateHashedToken(hashedToken);
    if (!publicAccessId) {
      logger.warn('Authentication failed: invalid or expired token', {
        method: ctx.method,
        path: ctx.path,
      });
    }
    ctx.cookies.set('public', token, {
      httpOnly: true,
      secure: ctx.app.env === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    ctx.state.publicAccessId = publicAccessId;

    await next();
  };
