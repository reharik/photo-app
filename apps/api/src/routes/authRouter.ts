import Router from '@koa/router';

import type { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/routeGuards';
import type { TokenHandshakeMiddleware } from '../middleware/tokenHandshakeMiddleware.js';

type AuthRouterDeps = {
  authController: AuthController;
  tokenHandshakeMiddleware: TokenHandshakeMiddleware;
};

export const build__Router = ({
  authController,
  tokenHandshakeMiddleware,
}: AuthRouterDeps): Router => {
  const router = new Router({ prefix: '/auth' });

  // Public routes
  router.post('/login', authController.login);
  router.post('/signup', authController.signup);
  router.post('/logout', authController.logout);
  router.post('/forgot-password', authController.forgotPassword);
  router.post('/reset-password', authController.resetPassword);
  router.post('/publicAccess', tokenHandshakeMiddleware, authController.publicAccess);

  // Protected routes
  router.get('/me', requireAuth(), authController.me);

  return router;
};
