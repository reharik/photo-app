import { Context, Next } from 'koa';
import { Config } from '../config';
import { OpenApiRequestContextScope } from '../di/generated/ioc-registry.types';

export interface ApiRequestContextMiddleware {
  (ctx: Context, next: Next): Promise<void>;
}

type ApiRequestContextMiddlewareDeps = {
  config: Config;
  openApiRequestContextScope: OpenApiRequestContextScope;
};

export const build__ApiRequestContextMiddleware =
  ({
    openApiRequestContextScope,
    config,
  }: ApiRequestContextMiddlewareDeps): ApiRequestContextMiddleware =>
  async (ctx, next) => {
    if (ctx.path === config.graphqlHttpPath) {
      await next();
      return;
    }
    const { apiRequestContext, dispose } = openApiRequestContextScope();
    ctx.state.scope = apiRequestContext;
    try {
      await next();
    } finally {
      await dispose();
    }
  };
