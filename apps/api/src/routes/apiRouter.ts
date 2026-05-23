import Router from '@koa/router';

export type RootRouter = Router;
const mountRouter = (parent: Router, child: Router) => {
  parent.use(child.routes());
  parent.use(child.allowedMethods());
};

type ApiRoutesDeps = {
  router: Router;
};

export const build__ApiRoutes = ({ router: authRouter }: ApiRoutesDeps): RootRouter => {
  const apiRouter = new Router({ prefix: '/api' });
  mountRouter(apiRouter, authRouter);
  return apiRouter;
};
