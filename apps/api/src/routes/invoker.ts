// src/router/invoke.ts
import { Context } from 'koa';
import { ApiRequestContext } from '../apiRequestContext';

type Handler = (ctx: Context) => Promise<Context> | Promise<void>;

/**
 * Binds a route to a controller method without resolving the controller at boot.
 *
 * The returned middleware looks the controller up on the request's scope at call time, so it
 * — and its `uow` four levels down — is the request's instance. A handler registered as
 * `router.post(path, controller.setPassword)` would instead capture whatever instance existed
 * when routes were registered, which is the root one, holding a root-lifetime transaction.
 *
 * @example
 * router.post('/auth/set-password', invoke('authController', 'setPassword'));
 */
export const invoke =
  <K extends keyof ApiRequestContext, M extends keyof ApiRequestContext[K]>(key: K, method: M) =>
  (ctx: Context) => {
    const controller = ctx.state.scope[key];
    return (controller[method] as Handler)(ctx);
  };
