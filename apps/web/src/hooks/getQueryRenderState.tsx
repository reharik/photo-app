import { NetworkStatus, OperationVariables } from '@apollo/client';
import type { ReactNode } from 'react';
import { PageSpinner } from '../ui/PageSpinner';
import { QueryErrorState } from '../ui/QueryErrorState';

export type QueryStateResult<TData> = {
  data: TData | undefined;
  content: ReactNode | undefined;
  refetch: () => void;
};

export type QueryLike<TData = unknown> = {
  loading: boolean;
  error?: unknown;
  data?: TData;
  refetch: () => void;
  networkStatus: NetworkStatus;
  fetchMore: (options: { variables: OperationVariables }) => Promise<unknown>;
};

export function getQueryRenderState<TQuery extends QueryLike, TSelected>(args: {
  query: TQuery;
  select: (data: NonNullable<TQuery['data']>) => TSelected | undefined;
}): QueryStateResult<TSelected>;

export function getQueryRenderState<TQuery extends QueryLike, TSelected, TMapped>(args: {
  query: TQuery;
  select: (data: NonNullable<TQuery['data']>) => TSelected | undefined;
  map: (value: TSelected) => TMapped;
}): QueryStateResult<TMapped>;

export function getQueryRenderState<TQuery extends QueryLike, TSelected, TMapped>({
  query,
  select,
  map,
}: {
  query: TQuery;
  select: (data: NonNullable<TQuery['data']>) => TSelected | undefined;
  map?: (value: TSelected) => TMapped;
}): QueryStateResult<TSelected | TMapped> {
  /** Full-page spinner only when there is nothing to show yet. Keeps subtree mounted during cache-first refetches. */
  if (query.loading && !query.data) {
    return {
      data: undefined,
      content: <PageSpinner />,
      refetch: query.refetch,
    };
  }
  if (query.error) {
    return {
      data: undefined,
      content: (
        <QueryErrorState
          error={{
            name: 'ApolloError',
            message: 'Response not successful: Received status code 500',
            graphQLErrors: [
              {
                message: 'Internal server error',
                path: ['viewer', 'albums'],
                extensions: {
                  code: 'INTERNAL_SERVER_ERROR',
                },
              },
            ],
            networkError: {
              name: 'ServerError',
              message: 'Response not successful: Received status code 500',
              statusCode: 500,
            },
          }}
        />
      ),
      refetch: query.refetch,
    };
  }

  if (!query.data) {
    return {
      data: undefined,
      content: undefined,
      refetch: query.refetch,
    };
  }

  const selected = select(query.data);

  if (!selected) {
    return {
      data: undefined,
      content: undefined,
      refetch: query.refetch,
    };
  }

  return {
    data: map ? map(selected) : selected,
    content: undefined,
    refetch: query.refetch,
  };
}
