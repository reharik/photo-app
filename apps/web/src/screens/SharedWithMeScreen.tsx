import { useQuery } from '@apollo/client/react';
import styled from 'styled-components';
import { SharedWithMeSection } from '../features/sharedWithMe/SharedWithMeSection';
import { ViewerSharedWithMedMediaItemsDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';
import { mapSharedWithMedMediaItemsQueryToVMs } from '../viewModels/sharing/mapSharedWithMedMediaItemsQueryToVMs';

export const SharedWithMeScreen = () => {
  const query = useQuery(ViewerSharedWithMedMediaItemsDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { data: sharedWithMeMediaItems, content } = getQueryRenderState({
    query,
    select: (data) => data.viewer?.sharedWithMeMediaItems,
    map: mapSharedWithMedMediaItemsQueryToVMs,
  });

  if (!sharedWithMeMediaItems) {
    return content;
  }

  return (
    <Container>
      <SharedWithMeSection sharedWithMeMediaItems={sharedWithMeMediaItems} />
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
