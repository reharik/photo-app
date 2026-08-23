import { createYoga } from 'graphql-yoga';
import Koa from 'koa';

import type { Config } from '../../config.js';
import type { GraphQLContextFactory } from '../context/types.js';
import { schema } from '../schema';
import { UseScopedContainer } from './useScopedContainer.js';

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
  graphQlContextFactory: GraphQLContextFactory;
  config: Config;
  useScopedContainer: UseScopedContainer;
};

export const build__YogaApp = ({
  graphQlContextFactory,
  config,
  useScopedContainer,
}: YogaAppDeps): YogaApp => {
  return createYoga<Koa.ParameterizedContext>({
    plugins: [useScopedContainer],
    schema,
    graphqlEndpoint: config.graphqlHttpPath,
    context: graphQlContextFactory,
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
