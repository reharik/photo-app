import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AddMediaItemsToAlbumDocument,
  AddMediaItemsToAlbumMutation,
  DeleteAlbumItemsFromAlbumDocument,
  DeleteAlbumItemsFromAlbumMutation,
  SetCoverMediaDocument,
  SetCoverMediaMutation,
  ViewerAlbumDetailDocument,
  ViewerRecentMediaDocument,
} from '../graphql/generated/types';
import { AlbumSection } from '../shared/components/AlbumSection';
import { getQueryRenderState } from '../shared/components/dataAccess/getQueryRenderState';
import { useAppMutationState } from '../shared/components/dataAccess/useAppMutation';
import { mapAlbumItemToAlbumItemSummaryVM } from '../viewModels/album/mapAlbumItemToAlbumItemSummaryVM';
import { mapAlbumToAlbumSummaryVM } from '../viewModels/album/mapAlbumToAlbumSummaryVM';
import { mapMediaItemToMediaItemSummaryVM } from '../viewModels/media/mapMediaItemToMediaItemSummaryVM';

export const AlbumScreen = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [addAlbumItemModalOpen, setAddAlbumItemModalOpen] = useState(false);
  const [removeFromAlbumOpen, setRemoveFromAlbumOpen] = useState(false);
  const [shareAlbumOpen, setShareAlbumOpen] = useState(false);
  const [shareItemsOpen, setShareItemsOpen] = useState(false);
  const addToAlbumMutation = useAppMutationState();
  const removeFromAlbumMutation = useAppMutationState();
  const addAlbumCoverMutation = useAppMutationState();

  const query = useQuery(ViewerAlbumDetailDocument, {
    variables: { albumId: albumId ?? '' },
    skip: !albumId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const mediaItemsForPickerQuery = useQuery(ViewerRecentMediaDocument, {
    skip: !addAlbumItemModalOpen,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { data, content } = getQueryRenderState({
    query,
    select: (data) => data.viewer?.album,
  });

  const pickerMediaItems = useMemo(() => {
    const mediaItems = mediaItemsForPickerQuery.data?.viewer?.mediaItems.nodes;
    const existingAlbumItems = data?.items.nodes;

    if (!mediaItems || !existingAlbumItems) {
      return [];
    }

    return mediaItems
      .filter((item) => !existingAlbumItems.some((albumItem) => albumItem.mediaItem.id === item.id))
      .map(mapMediaItemToMediaItemSummaryVM);
  }, [mediaItemsForPickerQuery.data, data]);

  if (!data) {
    return content;
  }

  const album = mapAlbumToAlbumSummaryVM(data);
  const albumItems = data.items.nodes.map(mapAlbumItemToAlbumItemSummaryVM) ?? [];

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

  if (!albumId || !album) {
    return (
      <Container>
        <StatusMessage role="alert">Missing album id.</StatusMessage>
      </Container>
    );
  }
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
  const shareState = {
    shareAlbumOpen,
    setShareAlbumOpen,
    shareItemsOpen,
    setShareItemsOpen,
  };
  return (
    <Container>
      {album && (
        <AlbumSection
          album={album}
          albumItems={albumItems}
          addAlbumItemState={addAlbumItemState}
          removeAlbumItemState={removeAlbumItemState}
          shareState={shareState}
          retrieveAlbumItems={query.refetch}
          submitAddAlbumCover={submitAddAlbumCover}
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
const StatusMessage = styled.div`
  max-width: 560px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.subtext};
  font-size: 15px;
`;
