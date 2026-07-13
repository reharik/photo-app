import { useApolloClient, useQuery } from '@apollo/client/react';
import { EntityType, SharedWithMeMediaItemSortBy, SortDir } from '@packages/contracts';
import { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { SharedWithMeSection } from '../features/sharedWithMe/SharedWithMeSection';
import {
  MarkSeenDocument,
  MarkSeenMutation,
  ViewerHasUnseenActivityDocument,
  ViewerSharedWithMeMediaItemsDocument,
} from '../graphql/generated/types';
import { usePaginatedQueryRenderState } from '../hooks/getPaginatedQueryRenderState';

import { useAppMutationState } from '../hooks/useAppMutation';

export const SharedWithMeScreen = () => {
  const apolloClient = useApolloClient();
  const markSeenMutation = useAppMutationState();
  const buildPageVariables = useCallback(
    (offset: number) => ({
      collectionInfo: {
        pageInfo: { limit: 20, offset },
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

  // Opening shared items = seeing its activity. Fire markSeen once the detail
  // resolves, once per album. On success, refetch the aggregate nav flag and the
  // shared-album list so their unseen dots clear. Real failures are logged, not
  // swallowed — the backend write is live.
  const mediaItemsLoaded = (sharedWithMeMediaItems?.nodes.length ?? 0) > 0;
  useEffect(() => {
    if (!mediaItemsLoaded) {
      return;
    }

    void (async () => {
      const result = await markSeenMutation.execute(
        {
          mutation: MarkSeenDocument,
          variables: {
            targetType: EntityType.mediaItem,
          },
        },
        (data: MarkSeenMutation) => ({ data: data.markSeen }),
      );

      if (!result.success) {
        console.error('markSeen failed for mediaItems', result.errors);
        return;
      }

      void apolloClient.refetchQueries({
        include: [ViewerHasUnseenActivityDocument],
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaItemsLoaded]);

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
