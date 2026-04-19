import { useQuery } from '@apollo/client/react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { ViewerAlbumDetailDocument } from '../graphql/generated/types';
import { AlbumSection } from '../shared/components/AlbumSection';

export const AlbumScreen = () => {
  const { albumId } = useParams<{ albumId: string }>();

  const { data, loading, error, refetch } = useQuery(ViewerAlbumDetailDocument, {
    variables: { albumId: albumId ?? '' },
    skip: !albumId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const album = data?.viewer?.album;

  if (!albumId) {
    return (
      <Container>
        <StatusMessage role="alert">Missing album id.</StatusMessage>
      </Container>
    );
  }

  return <Container>{album && <AlbumSection album={album} refetch={refetch} />}</Container>;
};

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;
const StatusMessage = styled.div`
  max-width: 560px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.subtext};
  font-size: 15px;
`;
