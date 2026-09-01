import type { Logger } from '@packages/infrastructure';
import { TokenAccessReadService } from '@packages/media-core';
import type { Context, Next } from 'koa';

export type TokenHandshakeMiddleware = (ctx: Context, next: Next) => Promise<void>;

type TokenHandshakeMiddlewareDeps = {
  tokenAccessReadService: TokenAccessReadService;
  logger: Logger;
};

export const build__TokenHandshakeMiddleware =
  ({ tokenAccessReadService, logger }: TokenHandshakeMiddlewareDeps): TokenHandshakeMiddleware =>
  async (ctx: Context, next: Next) => {
    const body = ctx.request.body as { token: string };
    const token = body.token;
    const publicAccessId = await tokenAccessReadService.validateToken(token);
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
