import { useEffect, useRef } from 'react';

export const useInfiniteScroll = ({
  hasMore,
  isLoadingMore,
  loadMore,
  rootMargin = '100px',
}: {
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  rootMargin?: string;
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({ hasMore, isLoadingMore, loadMore });
  stateRef.current = { hasMore, isLoadingMore, loadMore };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    console.log('observer setup:', {
      sentinel: sentinelRef.current,
      root: scrollRootRef.current,
      rootMargin,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        console.log('intersection:', {
          isIntersecting: entries[0].isIntersecting,
          intersectionRatio: entries[0].intersectionRatio,
          rootBounds: entries[0].rootBounds,
          boundingClientRect: entries[0].boundingClientRect,
          hasMore: stateRef.current.hasMore,
          isLoadingMore: stateRef.current.isLoadingMore,
        });

        const { hasMore, isLoadingMore, loadMore } = stateRef.current;
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          console.log('-> calling loadMore');
          loadMore();
        }
      },
      { rootMargin, root: scrollRootRef.current },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { sentinelRef, scrollRootRef };
};
