import type { ResolverFn } from '../generated/types.generated';
import { AuthenticatedGraphQLContext, GraphQLContext } from './types';

export const requireAuthenticatedContext = (ctx: GraphQLContext): AuthenticatedGraphQLContext => {
  if (!ctx.viewer || !ctx.writeServices || !ctx.readServices) {
    throw new Error('Not authenticated');
  }

  return {
    ...ctx,
    viewer: ctx.viewer,
    writeServices: ctx.writeServices,
    readServices: ctx.readServices,
  };
};

export const authenticatedResolver =
  <TParent, TArgs, TResult>(
    resolver: ResolverFn<TResult, TParent, AuthenticatedGraphQLContext, TArgs>,
  ): ResolverFn<TResult, TParent, GraphQLContext, TArgs> =>
  (parent, args, ctx, info) => {
    const authCtx = requireAuthenticatedContext(ctx);
    return resolver(parent, args, authCtx, info);
  };
