import Router from '@koa/router';

import type { MediaServeController } from '../controllers/mediaServeController.js';
import type { MediaAuthMiddleware } from '../middleware/mediaAuthMiddleware.js';

export type MediaPublicRouter = Router;

type MediaPublicRouterDeps = {
  mediaAuthMiddleware: MediaAuthMiddleware;
  mediaServeController: MediaServeController;
};

export const build__MediaPublicRouter = ({
  mediaAuthMiddleware,
  mediaServeController,
}: MediaPublicRouterDeps): MediaPublicRouter => {
  const router = new Router();
  router.get<{ mediaId: string; variant: string }>(
    '/media/:mediaId/:variant',
    mediaAuthMiddleware,
    mediaServeController.getMedia,
  );
  return router;
};
