import { type RefObject, useCallback } from 'react';
import { PagingState } from '../../hooks/getPaginatedQueryRenderState';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

type InfiniteScrollProps = {
  paging: PagingState;
  rootMargin?: string;
  children: React.ReactNode;
  className?: string;
  scrollRootRef?: RefObject<HTMLDivElement | null>;
};

export const InfiniteScroll = ({
  paging,
  rootMargin = '100px',
  children,
  className,
  scrollRootRef: externalScrollRootRef,
}: InfiniteScrollProps) => {
  const { sentinelRef, scrollRootRef } = useInfiniteScroll({
    ...paging,
    rootMargin,
  });

  const setScrollRootRef = useCallback(
    (el: HTMLDivElement | null): void => {
      scrollRootRef.current = el;
      if (externalScrollRootRef != null) {
        externalScrollRootRef.current = el;
      }
    },
    [externalScrollRootRef, scrollRootRef],
  );

  return (
    <div ref={setScrollRootRef} className={className} style={{ overflowY: 'auto' }}>
      {children}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
};
