import type { WriteResult } from '@packages/contracts';
import type { GraphQLResolveInfo } from 'graphql';
import type { ResolverFn } from '../generated/types.generated';
import { MutationPayload, writeResultToPayload } from '../util/writeResultToPayload';
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

// Write resolvers return a WriteResult<T> — never a hand-built payload. This wrapper owns
// the single mapping to the GraphQL `{ data, errors }` envelope (writeResultToPayload) AND
// the rollback decision, so neither can drift per-resolver. A mutation "fails as data": the
// failure rides in the returned payload's `errors`, never the GraphQL `errors` channel — the
// client contract depends on failures staying in the payload. The typed `result.success`
// discriminant replaces the former envelope-scan heuristic; a resolver that returns anything
// other than WriteResult<T> now fails typecheck.
export const authenticatedWriteResolver =
  <TParent, TArgs, TValue>(
    resolver: ResolverFn<WriteResult<TValue>, TParent, AuthenticatedWriteGraphQLContext, TArgs>,
  ): ResolverFn<MutationPayload<TValue>, TParent, GraphQLContext, TArgs> =>
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
    if (!result.success) {
      authCtx.uow.shouldRollback = true;
    }
    return writeResultToPayload(result);
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
