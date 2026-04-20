import { useQuery } from '@apollo/client/react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { ViewerAlbumDetailDocument } from '../graphql/generated/types';
import { AlbumSection } from '../shared/components/AlbumSection';
import { mapAlbumItemToAlbumItemSummaryVM } from '../viewModels/album/mapAlbumItemToAlbumItemSummaryVM';
import { mapAlbumToAlbumSummaryVM } from '../viewModels/album/mapAlbumToAlbumSummaryVM';

export const AlbumScreen = () => {
  const { albumId } = useParams<{ albumId: string }>();

  const { data, refetch } = useQuery(ViewerAlbumDetailDocument, {
    variables: { albumId: albumId ?? '' },
    skip: !albumId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const album = data?.viewer?.album ? mapAlbumToAlbumSummaryVM(data.viewer.album) : undefined;
  const albumItems = data?.viewer?.album?.items.nodes.map(mapAlbumItemToAlbumItemSummaryVM) ?? [];
  if (!albumId || !album) {
    return (
      <Container>
        <StatusMessage role="alert">Missing album id.</StatusMessage>
      </Container>
    );
  }

  return (
    <Container>
      {album && <AlbumSection album={album} albumItems={albumItems} refetch={refetch} />}
    </Container>
  );
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
