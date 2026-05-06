import Router from '@koa/router';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type RootRouter = Router;
const mountRouter = (parent: Router, child: Router) => {
  parent.use(child.routes());
  parent.use(child.allowedMethods());
};

export const build__ApiRoutes = ({ router: authRouter }: IocGeneratedCradle): RootRouter => {
  const apiRouter = new Router({ prefix: '/api' });
  mountRouter(apiRouter, authRouter);
  return apiRouter;
};
