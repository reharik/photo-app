import { useApolloClient } from '@apollo/client/react';
import type { DocumentNode } from 'graphql';
import { useEffect, useRef } from 'react';
import type { GalleryNavigation } from './mediaItemGalleryNavigation';

type UseNeighborDetailPrefetchParams = {
  enabled: boolean;
  galleryNavigation: GalleryNavigation;
  galleryIds: string[];
  mediaId: string | undefined;
  /** When false, skips prefetch until the current item's detail query has resolved. */
  mediaItemResolved: boolean;
  query: DocumentNode;
  queryContext?: Record<string, unknown>;
};

/**
 * Warms the Apollo cache for ±1 gallery neighbors' detail queries.
 * Complements {@link NeighborDisplayPrefetch} (image bytes).
 */
export const useNeighborDetailPrefetch = ({
  enabled,
  galleryNavigation,
  galleryIds,
  mediaId,
  mediaItemResolved,
  query,
  queryContext,
}: UseNeighborDetailPrefetchParams): void => {
  const client = useApolloClient();
  const lastPrefetchKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !mediaItemResolved || mediaId == null || mediaId === '') {
      return;
    }

    if (!galleryNavigation.enabled) {
      return;
    }

    const { currentIndex } = galleryNavigation;
    const prefetchKey = `${mediaId}:${currentIndex}`;
    if (lastPrefetchKeyRef.current === prefetchKey) {
      return;
    }
    lastPrefetchKeyRef.current = prefetchKey;

    const neighborIds: string[] = [];
    if (currentIndex > 0) {
      neighborIds.push(galleryIds[currentIndex - 1]);
    }
    if (currentIndex < galleryIds.length - 1) {
      neighborIds.push(galleryIds[currentIndex + 1]);
    }

    for (const neighborId of neighborIds) {
      void client.query({
        query,
        variables: { mediaItemId: neighborId },
        fetchPolicy: 'cache-first',
        ...(queryContext != null ? { context: queryContext } : {}),
      });
    }
  }, [
    client,
    enabled,
    galleryIds,
    galleryNavigation,
    mediaId,
    mediaItemResolved,
    query,
    queryContext,
  ]);
};
