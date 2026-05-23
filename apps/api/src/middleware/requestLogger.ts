import type { Logger } from '@packages/infrastructure';
import { Context, Next } from 'koa';

export type RequestLogger = (ctx: Context, next: Next) => Promise<void>;

type RequestLoggerDeps = {
  logger: Logger;
};

export const build__RequestLogger =
  ({ logger }: RequestLoggerDeps): RequestLogger =>
  async (ctx: Context, next: Next) => {
    const startTime = Date.now();

    logger.http('Incoming request', {
      method: ctx.method,
      path: ctx.path,
      ip: ctx.ip,
      userAgent: ctx.get('user-agent'),
    });

    await next();

    const duration = Date.now() - startTime;

    logger.http('Request completed', {
      method: ctx.method,
      path: ctx.path,
      status: ctx.status,
      duration: `${duration}ms`,
    });
  };
