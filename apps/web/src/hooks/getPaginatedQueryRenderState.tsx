import OperationVariables, { NetworkStatus } from '@apollo/client';
import { useCallback } from 'react';
import { getQueryRenderState, QueryLike, QueryStateResult } from './getQueryRenderState';

export type PagingState = {
  loadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
};

export type PagingStateResult<TData> = QueryStateResult<TData> & {
  paging: PagingState;
};

type PaginatedSelected<TNode = unknown> = {
  nodes: TNode[];
  totalCount: number;
};

type CollectionInfo<TExtra = Record<string, unknown>> = {
  pageInfo: { limit: number; offset: number };
} & TExtra;

export const usePaginatedQueryRenderState = <
  TQuery,
  TNode,
  TSelected extends PaginatedSelected<TNode>,
>({
  query,
  select,
  buildPageVariables,
}: {
  query: QueryLike<TQuery>;
  select: (data: TQuery) => TSelected;
  buildPageVariables: (offset: number) => OperationVariables;
}): PagingStateResult<TSelected> => {
  const base = getQueryRenderState({ query, select });

  const loadMore = useCallback(() => {
    if (!base.data) return;
    if (base.data.nodes.length >= base.data.totalCount) return;
    if (query.networkStatus === NetworkStatus.fetchMore) return;
    void query.fetchMore({ variables: buildPageVariables(base.data.nodes.length) });
  }, [base.data, query, buildPageVariables]);

  const hasMore = base.data ? base.data.nodes.length < base.data.totalCount : false;
  const isLoadingMore = query.networkStatus === NetworkStatus.fetchMore;

  return { ...base, paging: { loadMore, hasMore, isLoadingMore } };
};
