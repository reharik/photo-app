import { useQuery } from '@apollo/client/react';
import { SharedWithMeMediaItemSortBy, SortDir } from '@packages/contracts';
import { useCallback } from 'react';
import styled from 'styled-components';
import { SharedWithMeSection } from '../features/sharedWithMe/SharedWithMeSection';
import { ViewerSharedWithMeMediaItemsDocument } from '../graphql/generated/types';
import { usePaginatedQueryRenderState } from '../hooks/getPaginatedQueryRenderState';

export const SharedWithMeScreen = () => {
  const buildPageVariables = useCallback(
    (offset: number) => ({
      collectionInfo: {
        pageInfo: { limit: 10, offset },
        sortBy: SharedWithMeMediaItemSortBy.sharedAt,
        sortDir: SortDir.desc,
      },
    }),
    [],
  );
  const query = useQuery(ViewerSharedWithMeMediaItemsDocument, {
    variables: {
      ...buildPageVariables(0),
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
  });

  const {
    data: sharedWithMeMediaItems,
    content,
    paging,
    refetch,
  } = usePaginatedQueryRenderState({
    query,
    select: (data) => ({
      nodes: (data?.viewer?.sharedWithMeMediaItems?.nodes ?? []).map((x) => ({
        ...x,
        operations: x.mediaItem.operations,
      })),
      totalCount: data?.viewer?.sharedWithMeMediaItems?.totalCount ?? 0,
    }),
    buildPageVariables,
  });

  if (!sharedWithMeMediaItems) {
    return content;
  }

  return (
    <Container>
      <SharedWithMeSection
        sharedWithMeMediaItems={sharedWithMeMediaItems.nodes}
        paging={paging}
        reloadData={refetch}
      />
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;
