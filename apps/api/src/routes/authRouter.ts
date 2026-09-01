import Router from '@koa/router';
import type { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/routeGuards';
import type { TokenHandshakeMiddleware } from '../middleware/tokenHandshakeMiddleware.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AuthRouter extends Router {}

type AuthRouterDeps = {
  authController: AuthController;
  tokenHandshakeMiddleware: TokenHandshakeMiddleware;
};

export const build__AuthRouter = ({
  authController,
  tokenHandshakeMiddleware,
}: AuthRouterDeps): AuthRouter => {
  const router = new Router({ prefix: '/auth' });

  // Public routes
  router.post('/login', authController.login);
  router.post('/logout', authController.logout);
  router.post('/email-verification', authController.emailVerification);
  router.post('/set-password', authController.setPassword);
  router.post('/publicAccess', tokenHandshakeMiddleware, authController.publicAccess);

  // Protected routes
  router.get('/me', requireAuth(), authController.me);

  return router;
};
