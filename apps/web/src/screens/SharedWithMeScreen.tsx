import { useQuery } from '@apollo/client/react';
import styled from 'styled-components';
import { ViewerSharedWithMeDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../shared/components/dataAccess/getQueryRenderState';
import { SharedWithMeSection } from '../shared/components/SharedWithMeSection';
import { mapSharedWithMeQueryToVMs } from '../viewModels/sharing/mapSharedWithMeToVMs';

export const SharedWithMeScreen = () => {
  const query = useQuery(ViewerSharedWithMeDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { data: sharedWithMe, content } = getQueryRenderState({
    query,
    select: (data) => data.viewer?.sharedWithMe,
    map: mapSharedWithMeQueryToVMs,
  });

  if (!sharedWithMe) {
    return content;
  }

  return (
    <Container>
      <SharedWithMeSection sharedMediaItems={sharedWithMe.sharedMediaItems} />
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
