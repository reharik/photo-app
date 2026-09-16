import { useQuery } from '@apollo/client/react';
import { MediaItemSortBy, SortDir } from '@packages/contracts';
import { useCallback } from 'react';
import {
  mediaGridRestorationKeys,
  useRestoreAwareFetchPolicy,
} from '../features/media/grid/useMediaGridScrollRestoration';
import { LibrarySection } from '../features/media/LibrarySection';
import { ViewerLibraryDocument } from '../graphql/generated/types';
import { usePaginatedQueryRenderState } from '../hooks/getPaginatedQueryRenderState';
import { DEFAULT_PAGE_SIZE, useCachedFirstPageLimit } from '../hooks/useCachedFirstPageLimit';

export const HomeScreen = () => {
  const buildPageVariables = useCallback(
    (offset: number, limit: number = DEFAULT_PAGE_SIZE) => ({
      collectionInfo: {
        pageInfo: { limit, offset },
        sortBy: MediaItemSortBy.takenAt,
        sortDir: SortDir.desc,
      },
    }),
    [],
  );

  const { limit: firstPageLimit, cachedCount } = useCachedFirstPageLimit({
    query: ViewerLibraryDocument,
    firstPageVariables: buildPageVariables(0),
    countCachedNodes: (data) => data.viewer?.mediaItems.nodes.length,
    cacheKey: 'library',
  });
  const { fetchPolicy, nextFetchPolicy } = useRestoreAwareFetchPolicy({
    restorationKey: mediaGridRestorationKeys.library,
    cachedCount,
  });

  const query = useQuery(ViewerLibraryDocument, {
    variables: {
      ...buildPageVariables(0, firstPageLimit),
    },
    fetchPolicy,
    nextFetchPolicy,
    // MediaGrid scroll restoration's settle detection (paging.isSettled) depends on this.
    notifyOnNetworkStatusChange: true,
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
