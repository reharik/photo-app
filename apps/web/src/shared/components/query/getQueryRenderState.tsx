type QueryInput<TQueryData, TSelected, TMapped> = {
  loading: boolean;
  error?: unknown;
  data?: TQueryData;
  refetch: () => Promise<unknown>;
  select: (data: TQueryData) => TSelected | undefined;
  map?: (value: TSelected) => TMapped;
  emptyContent?: React.ReactNode;
};

type QueryStateResult<T> = {
  data?: T;
  content: React.ReactNode | null;
  refetch?: () => Promise<unknown>;
};

export function getQueryRenderState<TQueryData, TSelected, TMapped = TSelected>({
  loading,
  error,
  data,
  refetch,
  select,
  map,
  emptyContent = null,
}: QueryInput<TQueryData, TSelected, TMapped>): QueryStateResult<TMapped> {
  if (loading) {
    return { data: undefined, content: <PageSpinner />, refetch };
  }

  if (error) {
    return {
      data: undefined,
      content: <ErrorPanel error={error} onRetry={refetch} />,
      refetch,
    };
  }

  if (!data) {
    return { data: undefined, content: emptyContent, refetch };
  }

  const selected = select(data);
  if (!selected) {
    return { data: undefined, content: emptyContent, refetch };
  }

  return {
    data: map ? map(selected) : (selected as unknown as TMapped),
    content: null,
  };
}
