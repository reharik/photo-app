import { useQuery } from '@apollo/client/react';
import styled from 'styled-components';
import { SharedAlbumListSection } from '../features/sharedWithMe/SharedAlbumListSection';
import { ViewerSharedWithMeAlbumsDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';

export const SharedAlbumsListScreen = () => {
  const query = useQuery(ViewerSharedWithMeAlbumsDocument, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
  });

  const { data: sharedAlbums, content } = getQueryRenderState({
    query,
    select: (data) =>
      (data.viewer?.sharedWithMeAlbums?.nodes ?? []).map((node) => node.album),
  });

  if (!sharedAlbums) {
    return content;
  }

  return (
    <Container>
      <SharedAlbumListSection nodes={sharedAlbums} />
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;
