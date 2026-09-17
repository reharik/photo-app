import { RefObject, useCallback, useRef } from 'react';

export const useInfiniteScroll = ({
  hasMore,
  isLoadingMore,
  loadMore,
  rootMargin = '100px',
  scrollRootRef,
  itemCount,
}: {
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  rootMargin?: string;
  scrollRootRef?: RefObject<HTMLDivElement | null>;
  /** Changing this re-creates the observer, so every page gets a fresh initial intersection check. */
  itemCount: number;
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const stateRef = useRef({ hasMore, isLoadingMore, loadMore });
  stateRef.current = { hasMore, isLoadingMore, loadMore };

  // Callback ref: attaches to whichever item is currently Nth-from-end.
  // Re-runs when that node changes AND when itemCount changes (new callback identity →
  // React detaches and re-attaches). A fresh observe() always delivers an initial
  // entry, so a trigger that stayed in view across a page load still fires, and the
  // root picks up scrollRootRef once it is set (it is null on first mount).
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const { hasMore, isLoadingMore, loadMore } = stateRef.current;
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            loadMore();
          }
        },
        { rootMargin, root: scrollRootRef?.current },
      );
      observerRef.current.observe(node);
    },
    // itemCount is intentionally a dep only (not read): it forces re-observation per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootMargin, itemCount],
  );

  return { sentinelRef };
};
