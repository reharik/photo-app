import Router from '@koa/router';
import type { AppCradle } from '../di/generated/ioc-composed.js';
import { requireAuth } from '../middleware/routeGuards';

export const build__Router = ({
  authController,
  tokenHandshakeMiddleware,
}: AppCradle): Router => {
  const router = new Router({ prefix: '/auth' });

  // Public routes
  router.post('/login', authController.login);
  router.post('/signup', authController.signup);
  router.post('/logout', authController.logout);
  router.post('/publicAccess', tokenHandshakeMiddleware, authController.publicAccess);

  // Protected routes
  router.get('/me', requireAuth(), authController.me);

  return router;
};
