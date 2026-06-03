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

    const observer = new IntersectionObserver(
      (entries) => {
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
