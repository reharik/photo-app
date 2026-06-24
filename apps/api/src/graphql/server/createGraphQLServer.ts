import { createYoga } from 'graphql-yoga';
import Koa from 'koa';

import { AwilixContainer } from 'awilix';
import type { Config } from '../../config.js';
import { Cradle } from '../../container.js';
import type { GraphQLContextFactory } from '../context/types.js';
import { schema } from '../schema';
import { useScopedContainer } from './useScopedContainer.js';

/**
 * App-local contract for graphql-yoga so ioc-manifest can resolve a named contract symbol.
 */
export interface YogaApp {
  handleNodeRequestAndResponse(
    request: unknown,
    response: unknown,
    context: Koa.ParameterizedContext,
  ): Promise<Response>;
  fetch(input: string | URL, init?: RequestInit, context?: unknown): Promise<Response>;
}

export interface GraphQLServer {
  (ctx: Koa.ParameterizedContext, next: Koa.Next): Promise<void>;
}

interface GraphQLServerDeps {
  yogaApp: YogaApp;
}

type YogaAppDeps = {
  graphQLContextFactory: GraphQLContextFactory;
  config: Config;

  container: AwilixContainer<Cradle>;
};

export const build__YogaApp = ({
  graphQLContextFactory,
  config,
  container,
}: YogaAppDeps): YogaApp => {
  return createYoga<Koa.ParameterizedContext>({
    plugins: [useScopedContainer(container)],
    schema,
    graphqlEndpoint: config.graphqlHttpPath,
    context: graphQLContextFactory,
  }) as YogaApp;
};

export const build__GraphQLServer = ({ yogaApp }: GraphQLServerDeps): GraphQLServer => {
  return async (ctx: Koa.ParameterizedContext) => {
    const response = await yogaApp.handleNodeRequestAndResponse(ctx.request, ctx.res, ctx);
    ctx.status = response.status;

    for (const [key, value] of response.headers.entries()) {
      ctx.set(key, value);
    }
    ctx.body = response.body;
  };
};
