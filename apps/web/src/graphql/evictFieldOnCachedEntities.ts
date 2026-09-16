import type { ApolloClient } from '@apollo/client';

/**
 * Evicts `fieldName` (every keyArgs variant) from every normalized entity of `typename`
 * currently in the cache. The client uses InMemoryCache, whose extract() is the
 * normalized store (dataId → entity), so this enumerates what is actually cached rather
 * than guessing ids.
 *
 * An active query that reads the evicted field refetches on its own (cache miss on the
 * broadcast → network), keeping its previous data while loading.
 */
export const evictFieldOnCachedEntities = (
  client: ApolloClient,
  typename: string,
  fieldName: string,
): void => {
  const store = client.cache.extract() as Record<string, { __typename?: string } | undefined>;
  for (const [dataId, entity] of Object.entries(store)) {
    if (entity?.__typename === typename) {
      client.cache.evict({ id: dataId, fieldName });
    }
  }
};
