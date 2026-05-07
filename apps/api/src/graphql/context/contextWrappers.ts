import type { ResolverFn } from '../generated/types.generated';
import { AuthenticatedGraphQLContext, GraphQLContext, PublicGraphQLContext } from './types';

export const requireAuthenticatedContext = (ctx: GraphQLContext): AuthenticatedGraphQLContext => {
  if (!ctx.viewer || !ctx.writeServices || !ctx.readServices || !ctx.applyAuthorizationService) {
    throw new Error('Not authenticated');
  }

  return {
    ...ctx,
    viewer: ctx.viewer,
    writeServices: ctx.writeServices,
    readServices: ctx.readServices,
    applyAuthorizationService: ctx.applyAuthorizationService,
  };
};

export const requirePublicContext = (ctx: GraphQLContext): PublicGraphQLContext => {
  if (
    !ctx.publicReadServices ||
    !ctx.applyAuthorizationService ||
    !ctx.publicLinkId ||
    !ctx.publicAccessReadRepository
  ) {
    throw new Error('Not authenticated');
  }

  return {
    ...ctx,
    publicReadServices: ctx.publicReadServices,
    applyAuthorizationService: ctx.applyAuthorizationService,
    publicLinkId: ctx.publicLinkId,
    publicAccessReadRepository: ctx.publicAccessReadRepository,
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

export const publicResolver =
  <TParent, TArgs, TResult>(
    resolver: ResolverFn<TResult, TParent, PublicGraphQLContext, TArgs>,
  ): ResolverFn<TResult, TParent, GraphQLContext, TArgs> =>
  (parent, args, ctx, info) => {
    const authCtx = requirePublicContext(ctx);
    return resolver(parent, args, authCtx, info);
  };
