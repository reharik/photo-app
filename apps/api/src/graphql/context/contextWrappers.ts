import type { ResolverFn } from '../generated/types.generated';
import {
  AuthenticatedReadGraphQLContext,
  AuthenticatedWriteGraphQLContext,
  GraphQLContext,
  PublicGraphQLContext,
} from './types';

export const requireAuthenticatedReadContext = (
  ctx: GraphQLContext,
): AuthenticatedReadGraphQLContext => {
  if (ctx.kind !== 'authenticatedRead') {
    throw new Error('Not authenticated');
  }
  return ctx as AuthenticatedReadGraphQLContext;
};

export const requireAuthenticatedWriteContext = (
  ctx: GraphQLContext,
): AuthenticatedWriteGraphQLContext => {
  if (ctx.kind !== 'authenticatedWrite') {
    throw new Error('Not authenticated');
  }
  return ctx as AuthenticatedWriteGraphQLContext;
};

export const requirePublicContext = (ctx: GraphQLContext): PublicGraphQLContext => {
  if (ctx.kind !== 'public') {
    throw new Error('Public access context required');
  }
  return ctx;
};

export const authenticatedWriteResolver =
  <TParent, TArgs, TResult>(
    resolver: ResolverFn<TResult, TParent, AuthenticatedWriteGraphQLContext, TArgs>,
  ): ResolverFn<TResult, TParent, GraphQLContext, TArgs> =>
  (parent, args, ctx, info) => {
    const authCtx = requireAuthenticatedWriteContext(ctx);
    return resolver(parent, args, authCtx, info);
  };

export const authenticatedReadResolver =
  <TParent, TArgs, TResult>(
    resolver: ResolverFn<TResult, TParent, AuthenticatedReadGraphQLContext, TArgs>,
  ): ResolverFn<TResult, TParent, GraphQLContext, TArgs> =>
  (parent, args, ctx, info) => {
    const authCtx = requireAuthenticatedReadContext(ctx);
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
