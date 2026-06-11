import { useQuery } from '@apollo/client/react';
import { MediaItemSortBy, SortDir } from '@packages/contracts';
import { useCallback, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { PublicAlbumSection } from '../features/public/PublicAlbumSection';
import { PublicAlbumViewDocument } from '../graphql/generated/types';
import { usePaginatedQueryRenderState } from '../hooks/getPaginatedQueryRenderState';
import { resolvePublicQueryView } from './public/resolvePublicQueryView';
import { Toast } from '../ui/Toast';

export const PublicAlbumScreen = () => {
  const { token } = useParams<{ token: string }>();

  const [showSaveToast, setShowSaveToast] = useState(false);
  const buildPageVariables = useCallback(
    (offset: number) => ({
      collectionInfo: {
        pageInfo: { limit: 10, offset },
        sortBy: MediaItemSortBy.createdAt,
        sortDir: SortDir.desc,
      },
    }),
    [],
  );
  const query = useQuery(PublicAlbumViewDocument, {
    variables: {
      ...buildPageVariables(0),
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
    context: { accessMode: 'public' },
  });

  const { data, content, paging } = usePaginatedQueryRenderState({
    query,
    select: (data) => {
      if (!data.publicAccess?.album) {
        return undefined;
      }

      const { items, ...album } = data.publicAccess.album;
      return {
        album,
        nodes: items?.nodes ?? [],
        totalCount: items?.totalCount ?? 0,
      };
    },
    buildPageVariables,
  });

  if (!data) {
    const isAlbumUnavailable =
      query.data != null && query.data.publicAccess?.album == null;

    return resolvePublicQueryView({
      query,
      content,
      isUnavailable: isAlbumUnavailable,
    });
  }

  const album = data.album;
  const albumItems = data.nodes ?? [];
  const totalCount = data.totalCount ?? 0;
  if (albumItems.length === 1) {
    return <Navigate to={`/shared/${token}/media/${albumItems[0]?.mediaItem?.id}`} replace />;
  }
  return (
    <Container>
      {showSaveToast ? <Toast onDismiss={() => setShowSaveToast(false)} /> : null}
      {album && (
        <PublicAlbumSection
          album={album}
          albumItems={albumItems}
          paging={paging}
          totalCount={totalCount}
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
