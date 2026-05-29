import { useQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import styled from 'styled-components';
import { SharedWithMeSection } from '../features/sharedWithMe/SharedWithMeSection';
import { ViewerSharedWithMedMediaItemsDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';
import { mapSharedMediaItemsToVMs } from '../viewModels/sharing/mapSharedMediaItemToVM';

export const SharedWithMeScreen = () => {
  const query = useQuery(ViewerSharedWithMedMediaItemsDocument, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
  });

  const onReactionsRefetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const { data: sharedWithMeMediaItems, content } = getQueryRenderState({
    query,
    select: (data) => data.viewer?.sharedWithMeMediaItems ?? [],
    map: mapSharedMediaItemsToVMs,
  });

  if (!sharedWithMeMediaItems) {
    return content;
  }

  return (
    <Container>
      <SharedWithMeSection
        sharedWithMeMediaItems={sharedWithMeMediaItems}
        onReactionsRefetch={onReactionsRefetch}
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
