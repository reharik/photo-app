import { PagingState } from '../../hooks/getPaginatedQueryRenderState';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

type InfiniteScrollProps = {
  paging: PagingState;
  rootMargin?: string;
  children: React.ReactNode;
  className?: string;
};

export const InfiniteScroll = ({
  paging,
  rootMargin = '100px',
  children,
  className,
}: InfiniteScrollProps) => {
  const { sentinelRef, scrollRootRef } = useInfiniteScroll({
    ...paging,
    rootMargin,
  });

  return (
    <div ref={scrollRootRef} className={className} style={{ overflowY: 'auto' }}>
      {children}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
};
