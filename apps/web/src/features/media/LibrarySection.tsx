import { useApolloClient, useQuery } from '@apollo/client/react';
import { FrontendUploadStatus, MediaAssetKind, Operation } from '@packages/contracts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../../domain/formatters/mediaItemUrlBuilder';
import { useUploadQueue } from '../../contexts/UploadQueueContext';
import {
  AddMediaItemsToAlbumDocument,
  type AddMediaItemsToAlbumMutation,
  DeleteMediaItemsDocument,
  type DeleteMediaItemsMutation,
  ViewerAlbumsDocument,
} from '../../graphql/generated/types';
import { PagingState } from '../../hooks/getPaginatedQueryRenderState';
import {
  saveGalleryScrollPosition,
  useGalleryScrollRestoration,
} from '../../hooks/useGalleryScrollRestoration';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { AppModal } from '../../ui/AppModal';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { EmptyState } from '../../ui/EmptyState';
import { Toast } from '../../ui/Toast';
import { MediaItemSummaryVM } from '../../viewModels/';
import { AddItemsToAlbum } from '../gallery/AddItemsToAlbum';
import { InfiniteScroll } from '../gallery/InfiniteScroll';
import { GrantMediaItemShareModal } from '../sharing/GrantMediaItemShareModal';
import { MediaGrid } from './grid/MediaGrid';
import { LIBRARY_GRID_COLUMNS } from './grid/gridColumns';
import {
  LIBRARY_SELECTION_TOOLBAR_SLOT_HEIGHT,
  LibrarySelectionToolbar,
} from './library/LibrarySelectionToolbar';
import { UploadMediaButton } from './UploadMediaButton';

type LibrarySectionProps = {
  nodes: MediaItemSummaryVM[];
  reloadData: () => void;
  paging: PagingState;
};

export const LibrarySection = ({ nodes, paging, reloadData }: LibrarySectionProps) => {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const client = useApolloClient();
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
  const [deleteMediaOpen, setDeleteMediaOpen] = useState(false);
  const [shareMediaOpen, setShareMediaOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | undefined>(undefined);
  const { isLoading, errors, execute } = useAppMutationState();
  const {
    isLoading: isDeleteLoading,
    errors: deleteErrors,
    execute: executeDelete,
  } = useAppMutationState();

  const albumsQuery = useQuery(ViewerAlbumsDocument, {
    skip: !addToAlbumOpen,
    fetchPolicy: 'cache-first',
  });

  const dismissToast = useCallback((): void => {
    setToastMessage(undefined);
  }, []);

  const albumOptions = useMemo(
    () =>
      albumsQuery.data?.viewer?.albums.nodes.map((n) => ({
        id: n.id,
        title: n.title,
      })) ?? [],
    [albumsQuery.data],
  );
  const selectableActions = [
    {
      operation: Operation.grantMediaItemAlbumAuthorization,
      label: 'Share',
      onAction: () => setShareMediaOpen(true),
    },
    {
      label: 'Add to album',
      onAction: () => setAddToAlbumOpen(true),
    },
    {
      operation: Operation.deleteMediaItem,
      label: 'Delete from library',
      onAction: () => setDeleteMediaOpen(true),
    },
  ];

  const { multiSelectProps, selectedIds, availableActions, clearSelection, selectionCount } =
    useMultiSelectGallery({
      nodes,
      actions: selectableActions,
    });

  const { items } = useUploadQueue();

  useGalleryScrollRestoration({
    storageKey: 'library',
    scrollRootRef,
    ready: nodes.length > 0,
    nodeCount: nodes.length,
    loadMore: paging.loadMore,
    hasMore: paging.hasMore,
    isLoadingMore: paging.isLoadingMore,
  });

  const handleTileNavigate = useCallback((mediaId: string): void => {
    saveGalleryScrollPosition('library', scrollRootRef.current, mediaId);
  }, []);

  useEffect(() => {
    const newlyReadyForThisAlbum = items.filter((item) =>
      item.status.equals(FrontendUploadStatus.ready),
    );
    if (newlyReadyForThisAlbum.length > 0) {
      void reloadData();
    }
  }, [items, reloadData]);

  const submitDeleteMedia = async (): Promise<void> => {
    const result = await executeDelete(
      {
        mutation: DeleteMediaItemsDocument,
        variables: {
          input: { mediaItemIds: selectedIds },
        },
      },
      (data: DeleteMediaItemsMutation) => data.deleteMediaItems,
    );

    if (result.success) {
      setDeleteMediaOpen(false);
      clearSelection();
      void reloadData();
      await client.refetchQueries({ include: [ViewerAlbumsDocument] });
    }
  };

  const submitAddToAlbum = async (input: { albumId?: string; newAlbum?: { title: string } }) => {
    const result = await execute(
      {
        mutation: AddMediaItemsToAlbumDocument,
        variables: {
          input: {
            mediaItemIds: selectedIds,
            ...input,
          },
        },
      },
      (data: AddMediaItemsToAlbumMutation) => data.AddMediaItemsToAlbum,
    );

    if (result.success) {
      const addedCount = selectedIds.length;
      setAddToAlbumOpen(false);
      clearSelection();
      setToastMessage(
        addedCount === 1 ? 'Added 1 item to album' : `Added ${addedCount} items to album`,
      );
      await client.refetchQueries({ include: [ViewerAlbumsDocument] });
      return;
    }

    setToastMessage(result.errors[0]?.message ?? "Couldn't add items to album");
  };

  return (
    <Container>
      {toastMessage ? <Toast message={toastMessage} onDismiss={dismissToast} /> : null}
      <ToolbarSlot $active={selectionCount > 0}>
        {selectionCount > 0 ? (
          <LibrarySelectionToolbar
            count={selectionCount}
            onCancel={clearSelection}
            availableActions={availableActions}
          />
        ) : null}
      </ToolbarSlot>
      <ScrollArea paging={paging} rootMargin="600px">
        {nodes.length === 0 ? (
          <EmptyStateWrap>
            <EmptyState
              title="No media yet"
              text="Upload your first media to start building your family gallery"
              action={<UploadMediaButton />}
            />
          </EmptyStateWrap>
        ) : (
          <GridWrap>
            <MediaGrid
              nodes={nodes}
              multiSelectProps={multiSelectProps}
              selectableActions={selectableActions}
              selectionActive={selectionCount > 0}
              columnCounts={LIBRARY_GRID_COLUMNS}
              groupBy="date"
              getTileProps={(item, orderedMediaIds) => ({
                to: `/media/${item.id}`,
                thumbnailUrl: buildMediaItemUrl(item.id, MediaAssetKind.thumbnail),
                mediaGalleryIds: orderedMediaIds,
                kind: item.kind,
                title: item.title,
                reactionCounts: item.reactionCounts,
                testId: item.id,
                onBeforeNavigate: () => {
                  handleTileNavigate(item.id);
                },
              })}
            />
          </GridWrap>
        )}
      </ScrollArea>
      {addToAlbumOpen && (
        <AppModal
          onClose={() => setAddToAlbumOpen(false)}
          title={`Add ${selectedIds.length} ${selectedIds.length === 1 ? 'item' : 'items'} to an album`}
        >
          <AddItemsToAlbum
            onClose={() => setAddToAlbumOpen(false)}
            albumOptions={albumOptions}
            albumsLoading={albumsQuery.loading}
            isSubmitting={isLoading}
            mutationErrors={errors}
            onSubmit={async (target) => {
              if (target.kind === 'existing') {
                await submitAddToAlbum({ albumId: target.albumId });
              } else {
                await submitAddToAlbum({ newAlbum: { title: target.title } });
              }
            }}
          />
        </AppModal>
      )}
      {deleteMediaOpen && (
        <ConfirmationModal
          onClose={() => setDeleteMediaOpen(false)}
          onConfirm={submitDeleteMedia}
          title="Delete from library?"
          body={
            selectedIds.length === 1
              ? 'This item will be removed from your library and from any albums it appears in. This cannot be undone.'
              : `These ${selectedIds.length} items will be removed from your library and from any albums they appear in. This cannot be undone.`
          }
          confirmLabel="Delete"
          confirmingLabel="Deleting..."
          isSubmitting={isDeleteLoading}
          mutationErrors={deleteErrors}
        />
      )}
      {shareMediaOpen && (
        <GrantMediaItemShareModal
          mediaItemIds={selectedIds}
          onSuccessToast={setToastMessage}
          onErrorToast={setToastMessage}
          onClose={() => {
            setShareMediaOpen(false);
            clearSelection();
          }}
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

const ToolbarSlot = styled.div<{ $active: boolean }>`
  position: relative;
  z-index: 20;
  flex-shrink: 0;
  height: ${LIBRARY_SELECTION_TOOLBAR_SLOT_HEIGHT};
  box-sizing: border-box;
  background: ${({ $active, theme }) => ($active ? theme.color.bodyRaised : theme.color.body)};
  box-shadow: ${({ $active, theme }) =>
    $active ? `inset 0 -0.5px 0 ${theme.color.borderSubtle}` : 'none'};
  overflow: visible;
`;

const ScrollArea = styled(InfiniteScroll)`
  flex: 1;
  min-width: 0;
  min-height: 0;
`;

const GridWrap = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const EmptyStateWrap = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};
`;
