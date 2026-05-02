import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AlbumListSection } from '../features/albums/AlbumListSection';
import {
  CreateAlbumDocument,
  ViewerAlbumsDocument,
  type CreateAlbumMutation,
} from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';
import { useAppMutationState } from '../hooks/useAppMutation';
import { AppErrorPanel } from '../ui/AppErrorPanel';
import { mapMultipleAlbumsToAlbumSummaryVMs } from '../viewModels/album/mapAlbumToSummaryVM';

export const AlbumsListScreen = () => {
  const navigate = useNavigate();
  const { isLoading, errors, execute } = useAppMutationState();

  const query = useQuery(ViewerAlbumsDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { data: albums, content } = getQueryRenderState({
    query,
    select: (data) => data.viewer?.albums.nodes,
    map: mapMultipleAlbumsToAlbumSummaryVMs,
  });

  if (!albums) {
    return content;
  }

  const submitCreateAlbum = async (title: string) => {
    const result = await execute(
      {
        mutation: CreateAlbumDocument,
        variables: { input: { title } },
      },
      (mutationData: CreateAlbumMutation) => mutationData.createAlbum,
    );

    if (result.success) {
      await query.refetch();
      await navigate(`/albums/${result.data.albumId}`);
    }
  };

  return (
    <Container>
      <AppErrorPanel errors={errors} />
      <AlbumListSection
        nodes={albums}
        isCreatingAlbum={isLoading}
        submitCreateAlbum={submitCreateAlbum}
      />
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;
