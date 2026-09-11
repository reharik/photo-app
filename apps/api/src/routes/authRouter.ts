import Router from '@koa/router';
import type { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/routeGuards';
import type { TokenHandshakeMiddleware } from '../middleware/tokenHandshakeMiddleware.js';
import { invoke } from './invoker.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AuthRouter extends Router {}

type AuthRouterDeps = {
  authController: AuthController;
  tokenHandshakeMiddleware: TokenHandshakeMiddleware;
};

export const build__AuthRouter = ({ tokenHandshakeMiddleware }: AuthRouterDeps): AuthRouter => {
  const router = new Router({ prefix: '/auth' });

  // Public routes
  router.post('/login', invoke('authController', 'login'));
  router.post('/logout', invoke('authController', 'logout'));
  router.post('/email-verification', invoke('authController', 'emailVerification'));
  router.post('/set-password', invoke('authController', 'setPassword'));
  router.post('/publicAccess', tokenHandshakeMiddleware, invoke('authController', 'publicAccess'));

  // Protected routes
  router.get('/me', requireAuth(), invoke('authController', 'me'));

  return router;
};
