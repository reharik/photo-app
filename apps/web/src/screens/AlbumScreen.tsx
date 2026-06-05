import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { AlbumSection } from '../features/albums/AlbumSection';
import {
  AddMediaItemsToAlbumDocument,
  AddMediaItemsToAlbumMutation,
  DeleteAlbumItemsFromAlbumDocument,
  DeleteAlbumItemsFromAlbumMutation,
  MediaItemSortBy,
  SetCoverMediaDocument,
  SetCoverMediaMutation,
  SortDir,
  ViewerAlbumDetailDocument,
  ViewerLibraryDocument,
} from '../graphql/generated/types';
import { usePaginatedQueryRenderState } from '../hooks/getPaginatedQueryRenderState';
import { useAppMutationState } from '../hooks/useAppMutation';
import { Toast } from '../ui/Toast';

export const AlbumScreen = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [addAlbumItemModalOpen, setAddAlbumItemModalOpen] = useState(false);
  const [removeFromAlbumOpen, setRemoveFromAlbumOpen] = useState(false);
  const [shareAlbumOpen, setShareAlbumOpen] = useState(false);
  const [addCoverItemOpen, setAddCoverItemOpen] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const addToAlbumMutation = useAppMutationState();
  const removeFromAlbumMutation = useAppMutationState();
  const addAlbumCoverMutation = useAppMutationState();

  const buildPageVariables = useCallback(
    (offset: number) => ({
      albumId: albumId ?? '',
      collectionInfo: {
        pageInfo: { limit: 10, offset },
        sortBy: MediaItemSortBy.createdAt,
        sortDir: SortDir.desc,
      },
    }),
    [albumId],
  );

  const query = useQuery(ViewerAlbumDetailDocument, {
    variables: {
      ...buildPageVariables(0),
    },
    skip: !albumId,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
  });

  const { data, content, refetch, paging } = usePaginatedQueryRenderState({
    query,
    select: (data) => {
      if (!data.viewer?.album) {
        throw new Error('Album not found');
      }

      const { items, ...album } = data.viewer.album;
      return {
        album,
        nodes: items?.nodes ?? [],
        totalCount: items?.totalCount ?? 0,
      };
    },
    buildPageVariables,
  });

  const mediaItemsForPickerQuery = useQuery(ViewerLibraryDocument, {
    variables: {
      collectionInfo: {
        pageInfo: { limit: 10, offset: 0 },
        sortBy: MediaItemSortBy.createdAt,
        sortDir: SortDir.desc,
      },
    },
    skip: !addAlbumItemModalOpen,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const pickerMediaItems = useMemo(() => {
    const mediaItems = mediaItemsForPickerQuery.data?.viewer?.mediaItems.nodes;
    const existingAlbumItems = data?.nodes;

    if (!mediaItems || !existingAlbumItems) {
      return [];
    }

    return mediaItems.filter(
      (item) => !existingAlbumItems.some((albumItem) => albumItem.mediaItem.id === item.id),
    );
  }, [mediaItemsForPickerQuery.data, data]);

  const album = data?.album;
  const albumItems = data?.nodes ?? [];
  const totalCount = data?.totalCount ?? 0;
  if (!album || !album?.id) {
    return content;
  }

  const submitAddToAlbum = async (newAlbumItemIds: string[]) => {
    const result = await addToAlbumMutation.execute(
      {
        mutation: AddMediaItemsToAlbumDocument,
        variables: {
          input: {
            mediaItemIds: newAlbumItemIds,
            albumId: album.id,
          },
        },
      },
      (data: AddMediaItemsToAlbumMutation) => data.AddMediaItemsToAlbum,
    );

    if (result.success) {
      setAddAlbumItemModalOpen(false);
      setShowSaveToast(true);
      void query.refetch();
    }
  };

  const submitRemoveFromAlbum = async (selectedAlbumItemIds: string[]) => {
    const result = await removeFromAlbumMutation.execute(
      {
        mutation: DeleteAlbumItemsFromAlbumDocument,
        variables: {
          input: {
            albumId: album.id,
            albumItemIds: selectedAlbumItemIds,
          },
        },
      },
      (data: DeleteAlbumItemsFromAlbumMutation) => data.DeleteAlbumItemsFromAlbum,
    );

    if (result.success) {
      setRemoveFromAlbumOpen(false);
      setShowSaveToast(true);
      void query.refetch();
    }
  };

  const submitAddAlbumCover = async (selectedAlbumItemId: string) => {
    const result = await addAlbumCoverMutation.execute(
      {
        mutation: SetCoverMediaDocument,
        variables: {
          input: {
            albumId: album.id,
            albumItemId: selectedAlbumItemId,
          },
        },
      },
      (data: SetCoverMediaMutation) => data.SetCoverMedia,
    );

    if (result.success) {
      setRemoveFromAlbumOpen(false);
      void query.refetch();
    }
  };

  const addAlbumItemState = {
    addItemOpen: addAlbumItemModalOpen,
    setAddItemOpen: setAddAlbumItemModalOpen,
    submitAddToAlbum: submitAddToAlbum,
    pickerMediaItems,
  };
  const removeAlbumItemState = {
    removeItemOpen: removeFromAlbumOpen,
    setRemoveItemOpen: setRemoveFromAlbumOpen,
    submitRemoveFromAlbum: submitRemoveFromAlbum,
    removeFromAlbumMutation: removeFromAlbumMutation,
  };
  const modalState = {
    shareAlbumOpen,
    setShareAlbumOpen,
    addCoverItemOpen,
    setAddCoverItemOpen,
  };
  return (
    <Container>
      {showSaveToast ? <Toast onDismiss={() => setShowSaveToast(false)} /> : null}
      {album && (
        <AlbumSection
          album={album}
          paging={paging}
          albumItems={albumItems}
          totalCount={totalCount}
          addAlbumItemState={addAlbumItemState}
          removeAlbumItemState={removeAlbumItemState}
          modalState={modalState}
          retrieveAlbumItems={query.refetch}
          submitAddAlbumCover={submitAddAlbumCover}
          reloadData={refetch}
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
