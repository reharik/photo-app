import { Context, Next } from 'koa';

export type RequestIdMiddleware = (ctx: Context, next: Next) => Promise<void>;

export const build__RequestIdMiddleware =
  (): RequestIdMiddleware => async (ctx: Context, next: Next) => {
    const inbound = ctx.get('x-request-id');
    const requestId = /^[\w-]{1,64}$/.test(inbound) ? inbound : crypto.randomUUID();
    ctx.state.requestId = requestId;
    ctx.set('x-request-id', requestId);

    await next();
  };
