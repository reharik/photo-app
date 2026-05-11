import type { ResolverFn } from '../generated/types.generated';
import { AuthenticatedGraphQLContext, GraphQLContext, PublicGraphQLContext } from './types';

export const requireAuthenticatedContext = (ctx: GraphQLContext): AuthenticatedGraphQLContext => {
  if (ctx.kind !== 'authenticated') {
    throw new Error('Not authenticated');
  }
  return ctx;
};

export const requirePublicContext = (ctx: GraphQLContext): PublicGraphQLContext => {
  if (ctx.kind !== 'public') {
    throw new Error('Public access context required');
  }
  return ctx;
};

export const authenticatedResolver =
  <TParent, TArgs, TResult>(
    resolver: ResolverFn<TResult, TParent, AuthenticatedGraphQLContext, TArgs>,
  ): ResolverFn<TResult, TParent, GraphQLContext, TArgs> =>
  (parent, args, ctx, info) => {
    const authCtx = requireAuthenticatedContext(ctx);
    return resolver(parent, args, authCtx, info);
  };

export const publicResolver =
  <TParent, TArgs, TResult>(
    resolver: ResolverFn<TResult, TParent, PublicGraphQLContext, TArgs>,
  ): ResolverFn<TResult, TParent, GraphQLContext, TArgs> =>
  (parent, args, ctx, info) => {
    const publicCtx = requirePublicContext(ctx);
    return resolver(parent, args, publicCtx, info);
  };
