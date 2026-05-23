import Router from '@koa/router';
import type { AppCradle } from '../di/generated/ioc-composed.js';

export type MediaPublicRouter = Router;

export const build__MediaPublicRouter = ({
  mediaAuthMiddleware,
  mediaServeController,
}: AppCradle): MediaPublicRouter => {
  const router = new Router();
  router.get<{ mediaId: string; variant: string }>(
    '/media/:mediaId/:variant',
    mediaAuthMiddleware,
    mediaServeController.getMedia,
  );
  return router;
};
