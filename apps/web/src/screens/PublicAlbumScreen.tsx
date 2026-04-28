import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import styled from 'styled-components';
import { PublicAlbumViewDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../shared/components/dataAccess/getQueryRenderState';
import { Toast } from '../shared/components/ui/Toast';
import { mapPublicAlbumItemToSummaryVM } from '../viewModels/publicAlbum/mapPublicAlbumItemToSummaryVM';
import { mapPublicAlbumToSummaryVM } from '../viewModels/publicAlbum/mapPublicAlbumToSummaryVM';

export const PublicAlbumScreen = () => {
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

  const album = mapPublicAlbumToSummaryVM(data);
  const albumItems = data.items.nodes.map(mapPublicAlbumItemToSummaryVM) ?? [];

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
