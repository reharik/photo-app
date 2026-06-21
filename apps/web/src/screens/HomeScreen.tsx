import { useQuery } from '@apollo/client/react';
import { MediaItemSortBy, SortDir } from '@packages/contracts';
import { useCallback } from 'react';
import { LibrarySection } from '../features/media/LibrarySection';
import { ViewerLibraryDocument } from '../graphql/generated/types';
import { usePaginatedQueryRenderState } from '../hooks/getPaginatedQueryRenderState';

export const HomeScreen = () => {
  const buildPageVariables = useCallback(
    (offset: number) => ({
      collectionInfo: {
        pageInfo: { limit: 20, offset },
        sortBy: MediaItemSortBy.createdAt,
        sortDir: SortDir.desc,
      },
    }),
    [],
  );

  const query = useQuery(ViewerLibraryDocument, {
    variables: {
      ...buildPageVariables(0),
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
  });

  const { data, content, refetch, paging } = usePaginatedQueryRenderState({
    query,
    select: (data) => data?.viewer?.mediaItems ?? { nodes: [], totalCount: 0 },
    buildPageVariables,
  });

  if (!data) {
    return content;
  }

  return <LibrarySection nodes={data.nodes} paging={paging} reloadData={refetch} />;
};
