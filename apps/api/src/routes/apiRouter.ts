import Router from '@koa/router';
import type { AppCradle } from '../di/generated/ioc-composed.js';

export type RootRouter = Router;
const mountRouter = (parent: Router, child: Router) => {
  parent.use(child.routes());
  parent.use(child.allowedMethods());
};

export const build__ApiRoutes = ({ router: authRouter }: AppCradle): RootRouter => {
  const apiRouter = new Router({ prefix: '/api' });
  mountRouter(apiRouter, authRouter);
  return apiRouter;
};
