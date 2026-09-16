import type { OperationVariables, TypedDocumentNode } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { useRef } from 'react';

export const DEFAULT_PAGE_SIZE = 20;

/**
 * The API silently clamps page size to this (apps/api/src/graphql/resolvers/standardizeInput.ts).
 * Asking for more just returns this many; the grid's loadMore covers the remainder.
 */
const SERVER_MAX_PAGE_LIMIT = 100;

/**
 * First-page `limit` (and the cached node count) for a paginated `cache-and-network` query.
 *
 * On remount the cache may already hold N merged pages. The automatic network refetch
 * is an offset-0 request, and `nestedPagePagination` replaces the list on offset 0 — so
 * requesting only one page would collapse the list back to 20 items. Requesting
 * `limit = N` (clamped to the server cap) refreshes the whole loaded list in one round
 * trip instead.
 *
 * `limit` is not part of any paginated field's keyArgs, so a different limit reads and
 * writes the same cache entry. `firstPageVariables` must be the default-size first page.
 *
 * The value is frozen per `cacheKey`: it is recomputed only when the key changes (e.g. a
 * different album or sort), never as pages load — changing it would change the query
 * variables and trigger another fetch. `cachedCount` (frozen alongside) feeds the
 * serve-from-cache decision in `useRestoreAwareFetchPolicy`.
 */
export const useCachedFirstPageLimit = <TData, TVariables extends OperationVariables>({
  query,
  firstPageVariables,
  countCachedNodes,
  cacheKey,
}: {
  query: TypedDocumentNode<TData, TVariables>;
  firstPageVariables: TVariables;
  countCachedNodes: (data: TData) => number | undefined;
  cacheKey: string;
}): { limit: number; cachedCount: number } => {
  const client = useApolloClient();
  const frozenRef = useRef<{ cacheKey: string; limit: number; cachedCount: number } | null>(null);

  if (frozenRef.current?.cacheKey !== cacheKey) {
    let cachedCount = 0;
    try {
      const data = client.readQuery({ query, variables: firstPageVariables });
      cachedCount = data == null ? 0 : (countCachedNodes(data) ?? 0);
    } catch {
      cachedCount = 0;
    }
    frozenRef.current = {
      cacheKey,
      limit: Math.min(Math.max(cachedCount, DEFAULT_PAGE_SIZE), SERVER_MAX_PAGE_LIMIT),
      cachedCount,
    };
  }

  return { limit: frozenRef.current.limit, cachedCount: frozenRef.current.cachedCount };
};
