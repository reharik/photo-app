import { RefObject, useCallback, useRef } from 'react';

export const useInfiniteScroll = ({
  hasMore,
  isLoadingMore,
  loadMore,
  rootMargin = '100px',
  scrollRootRef,
}: {
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  rootMargin?: string;
  scrollRootRef?: RefObject<HTMLDivElement | null>;
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const stateRef = useRef({ hasMore, isLoadingMore, loadMore });
  stateRef.current = { hasMore, isLoadingMore, loadMore };

  // Callback ref: attaches to whichever item is currently Nth-from-end.
  // Re-runs each time that node changes (i.e. every page), so the observer
  // always watches the live trigger element, never a stale one.
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
    [rootMargin],
  );

  return { sentinelRef };
};
