import { useApolloClient, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AppError } from '../application/errors/types';
import { executeMutation } from '../application/graphql/executeMutation';
import {
  CreateAlbumDocument,
  ViewerAlbumsDocument,
  type CreateAlbumMutation,
} from '../graphql/generated/types';
import { AlbumListSection } from '../shared/components/AlbumListSection';
import { getQueryRenderState } from '../shared/components/query/getQueryRenderState';
import { AppErrorPanel } from '../shared/components/ui/AppErrorPanel';
import { mapMultipleAlbumsToAlbumSummaryVMs } from '../viewModels/album/mapAlbumToAlbumSummaryVM';

export const AlbumsListScreen = () => {
  const navigate = useNavigate();
  const client = useApolloClient();
  const [appErrors, setAppErrors] = useState<AppError[]>([]);

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
    setAppErrors([]);

    const result = await executeMutation(
      client,
      {
        mutation: CreateAlbumDocument,
        variables: { input: { title } },
      },
      (mutationData: CreateAlbumMutation) => mutationData.createAlbum,
    );

    if (!result.success) {
      setAppErrors(result.errors);
      return false;
    }

    await query.refetch();
    await navigate(`/albums/${result.data.albumId}`);
    return true;
  };

  return (
    <Container>
      <AppErrorPanel errors={appErrors} />
      <AlbumListSection nodes={albums} submitCreateAlbum={submitCreateAlbum} />
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;
