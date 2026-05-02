import { useQuery } from '@apollo/client/react';
import styled from 'styled-components';
import { SharedWithMeSection } from '../features/sharedWithMe/SharedWithMeSection';
import { ViewerSharedMediaItemsDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';
import { mapSharedMediaItemsQueryToVMs } from '../viewModels/sharing/mapSharedMediaItemsQueryToVMs';

export const SharedWithMeScreen = () => {
  const query = useQuery(ViewerSharedMediaItemsDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { data: sharedMediaItems, content } = getQueryRenderState({
    query,
    select: (data) => data.viewer?.sharedMediaItems,
    map: mapSharedMediaItemsQueryToVMs,
  });

  if (!sharedMediaItems) {
    return content;
  }

  return (
    <Container>
      <SharedWithMeSection sharedMediaItems={sharedMediaItems} />
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
