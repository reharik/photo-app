import Router from '@koa/router';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type MediaPublicRouter = Router;

export const buildMediaPublicRouter = ({
  mediaAuthMiddleware,
  mediaServeController,
}: IocGeneratedCradle): MediaPublicRouter => {
  const router = new Router();
  router.get<{ mediaId: string; variant: string }>(
    '/media/:mediaId/:variant',
    mediaAuthMiddleware,
    mediaServeController.getMedia,
  );
  return router;
};
