import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { PublicAlbumSection } from '../features/public/PublicAlbumSection';
import { PublicAlbumViewDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';
import { Toast } from '../ui/Toast';
import { PublicAlbumItemSummaryVM } from '../viewModels';

export const PublicAlbumScreen = () => {
  const { token } = useParams<{ token: string }>();

  const [showSaveToast, setShowSaveToast] = useState(false);

  const query = useQuery(PublicAlbumViewDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { data, content } = getQueryRenderState({
    query,
    select: (data) => data.publicAccess?.album,
  });

  if (!data) {
    return content;
  }

  const album = { ...data, itemCount: data.items.nodes.length };
  const albumItems: PublicAlbumItemSummaryVM[] = data.items.nodes;
  if (!data) {
    return content;
  }
  if (data.items.nodes.length === 1) {
    return <Navigate to={`/shared/${token}/media/${data.items.nodes[0].mediaItem.id}`} replace />;
  }
  return (
    <Container>
      {showSaveToast ? <Toast onDismiss={() => setShowSaveToast(false)} /> : null}
      {album && (
        <PublicAlbumSection
          album={album}
          albumItems={albumItems}
          retrieveAlbumItems={query.refetch}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;
