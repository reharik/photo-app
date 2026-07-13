import type { GraphQLResolveInfo } from 'graphql';
import type { ResolverFn } from '../generated/types.generated';
import {
  AuthenticatedReadGraphQLContext,
  AuthenticatedWriteGraphQLContext,
  GraphQLContext,
  PublicGraphQLContext,
} from './types';

// The guards throw a bare error when the resolved context kind doesn't match what a
// resolver requires. That leaves no trace of *which* resolver was hit or what kind the
// request actually resolved to — the two facts you need to debug a spurious auth failure.
// Log a warning with that context, then rethrow so behaviour is unchanged.
const logContextRejection = (
  ctx: GraphQLContext,
  info: GraphQLResolveInfo,
  requiredKind: string,
  err: unknown,
): void => {
  ctx.logger.warn('GraphQL resolver rejected: context kind mismatch', {
    field: info.fieldName,
    parentType: info.parentType.name,
    operation: info.operation.operation,
    requiredKind,
    actualKind: ctx.kind,
    viewerId: 'viewer' in ctx ? ctx.viewer.id : undefined,
    error: err instanceof Error ? err.message : String(err),
  });
};

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

// A mutation "fails as data": the failure rides in the returned payload, never the
// GraphQL `errors` channel. Write resolvers return heterogeneous shapes — a raw
// WriteResult ({ success:false, error }), the mapped MutationPayload ({ data, errors[] }),
// or a hand-built payload ({ success, errors[] }) — so we check BOTH signals: an explicit
// `success: false` OR a non-empty `errors` array. Any success case (success:true, or
// errors:[] / no errors key) reads as no-failure. We must NOT move these failures onto the
// GraphQL errors channel — the client contract depends on them staying in the payload.
const resultIndicatesFailure = (result: unknown): boolean => {
  if (typeof result !== 'object' || result === null) {
    return false;
  }
  if ('success' in result && result.success === false) {
    return true;
  }
  if ('errors' in result) {
    const errors = result.errors;
    return Array.isArray(errors) && errors.length > 0;
  }
  return false;
};

export const authenticatedWriteResolver =
  <TParent, TArgs, TResult>(
    resolver: ResolverFn<TResult, TParent, AuthenticatedWriteGraphQLContext, TArgs>,
  ): ResolverFn<TResult, TParent, GraphQLContext, TArgs> =>
  async (parent, args, ctx, info) => {
    let authCtx: AuthenticatedWriteGraphQLContext;
    try {
      authCtx = requireAuthenticatedWriteContext(ctx);
    } catch (err) {
      logContextRejection(ctx, info, 'authenticatedWrite', err);
      throw err;
    }
    const result = await resolver(parent, args, authCtx, info);
    // Signal intent only — the boundary (useScopedContainer) owns the actual rollback.
    // Latching to true; any single failed field rolls back the whole per-request uow.
    if (resultIndicatesFailure(result)) {
      authCtx.uow.shouldRollback = true;
    }
    // Return the payload verbatim so the failure still flows to the client as data.
    return result;
  };

export const authenticatedReadResolver =
  <TParent, TArgs, TResult>(
    resolver: ResolverFn<TResult, TParent, AuthenticatedReadGraphQLContext, TArgs>,
  ): ResolverFn<TResult, TParent, GraphQLContext, TArgs> =>
  (parent, args, ctx, info) => {
    let authCtx: AuthenticatedReadGraphQLContext;
    try {
      authCtx = requireAuthenticatedReadContext(ctx);
    } catch (err) {
      logContextRejection(ctx, info, 'authenticatedRead', err);
      throw err;
    }
    return resolver(parent, args, authCtx, info);
  };

export const publicResolver =
  <TParent, TArgs, TResult>(
    resolver: ResolverFn<TResult, TParent, PublicGraphQLContext, TArgs>,
  ): ResolverFn<TResult, TParent, GraphQLContext, TArgs> =>
  (parent, args, ctx, info) => {
    let publicCtx: PublicGraphQLContext;
    try {
      publicCtx = requirePublicContext(ctx);
    } catch (err) {
      logContextRejection(ctx, info, 'public', err);
      throw err;
    }
    return resolver(parent, args, publicCtx, info);
  };
