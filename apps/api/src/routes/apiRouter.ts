import Router from '@koa/router';
import { AuthRouter } from './authRouter';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface APIRouter extends Router {}
const mountRouter = (parent: Router, child: Router) => {
  parent.use(child.routes());
  parent.use(child.allowedMethods());
};

type ApiRoutesDeps = {
  authRouter: AuthRouter;
};

export const build__ApiRouter = ({ authRouter }: ApiRoutesDeps): APIRouter => {
  const apiRouter = new Router({ prefix: '/api' });
  mountRouter(apiRouter, authRouter);
  return apiRouter;
};
