import { useQuery } from '@apollo/client/react';
import { AlbumItemSortBy, SortDir } from '@packages/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { AlbumSection } from '../features/albums/AlbumSection';
import type { AlbumGroupBy } from '../features/albums/AlbumSectionMetadata';
import {
  AddMediaItemsToAlbumDocument,
  AddMediaItemsToAlbumMutation,
  DeleteAlbumItemsFromAlbumDocument,
  DeleteAlbumItemsFromAlbumMutation,
  MediaItemSortBy,
  SetCoverMediaDocument,
  SetCoverMediaMutation,
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
  const [groupBy, setGroupBy] = useState<AlbumGroupBy>('none');
  const [sortDir, setSortDir] = useState<SortDir>(SortDir.desc);
  const sortParamsInitialized = useRef(false);

  const buildPageVariables = useCallback(
    (offset: number) => {
      return {
        albumId: albumId ?? '',
        collectionInfo: {
          pageInfo: { limit: 20, offset },
          sortBy: groupBy === 'takenDate' ? AlbumItemSortBy.takenAt : AlbumItemSortBy.createdAt,
          sortDir,
        },
      };
    },
    [albumId, groupBy, sortDir],
  );

  const query = useQuery(ViewerAlbumDetailDocument, {
    variables: {
      ...buildPageVariables(0),
    },
    skip: !albumId,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
  });

  const {
    data: albumData,
    content,
    refetch,
    paging,
  } = usePaginatedQueryRenderState({
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

  useEffect(() => {
    if (!sortParamsInitialized.current) {
      sortParamsInitialized.current = true;
      return;
    }
    void query.refetch(buildPageVariables(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy, sortDir]); // ONLY sort inputs — not query, not buildPageVariables

  // replace the bare useQuery with the paginated hook
  const buildPickerVariables = useCallback(
    (offset: number) => ({
      collectionInfo: {
        pageInfo: { limit: 20, offset },
        sortBy: MediaItemSortBy.createdAt,
        sortDir: SortDir.desc,
      },
    }),
    [],
  );

  const mediaItemsForPickerQuery = useQuery(ViewerLibraryDocument, {
    variables: buildPickerVariables(0),
    skip: !addAlbumItemModalOpen,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const pickerState = usePaginatedQueryRenderState({
    query: mediaItemsForPickerQuery,
    select: (data) => {
      const mediaItems = data?.viewer?.mediaItems.nodes || [];
      const existingAlbumItems = albumData?.nodes || [];

      const items = mediaItems.filter(
        (item) => !existingAlbumItems.some((albumItem) => albumItem.mediaItem.id === item.id),
      );
      return { nodes: items, totalCount: data.viewer?.mediaItems.totalCount ?? 0 };
    },
    buildPageVariables: buildPickerVariables,
  });

  const album = albumData?.album;
  const albumItems = albumData?.nodes ?? [];
  const totalCount = albumData?.totalCount ?? 0;
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
    pickerMediaItems: pickerState.data?.nodes ?? [],
    pickerTotalCount: pickerState.data?.totalCount ?? 0,
    pickerPaging: pickerState.paging,
    pickerRefetch: pickerState.refetch,
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
          groupBy={groupBy}
          sortDir={sortDir}
          onGroupByChange={setGroupBy}
          onSortDirChange={setSortDir}
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
