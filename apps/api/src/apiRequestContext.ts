// src/di/apiRequestContext.ts
import { ScopeRoot } from 'ioc-manifest';
import { AuthController } from './controllers/authController';

/**
 * The entry points a REST request may reach.
 *
 * Only controllers belong here. Everything they depend on — services, repositories, `uow` —
 * resolves transitively inside the scope and does not need declaring. The contract exists to
 * state what a handler is allowed to reach in and grab by hand.
 *
 * No late-bound values: REST endpoints here are login / reset / set-password, which run before
 * there is a viewer. That is why the annotation is arity-1. If an endpoint later needs a
 * per-request value, add the second type argument and the opener will require it.
 */
export interface ApiRequestContext {
  authController: AuthController;
}

type ApiRequestContextDeps = {
  authController: AuthController;
};

export const build__ApiRequestContext = ({
  authController,
}: ApiRequestContextDeps): ScopeRoot<ApiRequestContext> => ({
  authController,
});
