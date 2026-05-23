import type { Logger } from '@packages/infrastructure';
import { Context, HttpError, Next } from 'koa';

export type ErrorHandler = (ctx: Context, next: Next) => Promise<void>;

type ErrorHandlerDeps = {
  logger: Logger;
};

export const build__ErrorHandler =
  ({ logger }: ErrorHandlerDeps): ErrorHandler =>
  async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (err) {
      if (err instanceof HttpError) {
        ctx.status = err.status || 500;
        ctx.body = {
          error: err.expose ? err.message : 'Internal Server Error',
        };
      } else if (err instanceof Error) {
        ctx.status = 500;
        ctx.body = {
          error: err.message ? err.message : 'Internal Server Error',
        };
      }

      const error = err instanceof Error ? err : new Error(String(err));

      logger.error(`Request error: ${ctx.method} ${ctx.path}`, error, {
        status: ctx.status,
        method: ctx.method,
        path: ctx.path,
        requestId: ctx.get('x-request-id') || undefined,
        isHttpError: err instanceof HttpError,
        expose: err instanceof HttpError ? err.expose : false,
      });

      ctx.app.emit('error', err, ctx);
    }
  };
