import Router from '@koa/router';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type PublicAuthRouter = Router;

export const buildPublicAuthRouter = ({
  tokenAuthMiddleware,
  mediaServeController,
}: IocGeneratedCradle): PublicAuthRouter => {
  const router = new Router();
  router.get('/share/:token', tokenAuthMiddleware);
  return router;
};
