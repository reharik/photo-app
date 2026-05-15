import { useApolloClient, useQuery } from '@apollo/client/react';
import { ViewerOperation } from '@packages/contracts';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  AddMediaItemsToAlbumDocument,
  type AddMediaItemsToAlbumMutation,
  DeleteMediaItemsDocument,
  type DeleteMediaItemsMutation,
  ViewerAlbumsDocument,
} from '../../graphql/generated/types';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { AppModal } from '../../ui/AppModal';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { EmptyState } from '../../ui/EmptyState';
import { Toast } from '../../ui/Toast';
import { MediaItemSummaryVM } from '../../viewModels/';
import { AddItemsToAlbum } from '../gallery/AddItemsToAlbum';
import { SelectableGallery } from '../gallery/SelectableGallery';
import { SelectableGalleryHeader } from '../gallery/SelectableGalleryHeader';
import { MediaItemTile } from '../gallery/tiles/MediaItemTile';
import { UploadMediaButton } from '../media/UploadMediaButton';
import { GrantMediaItemShareModal } from '../sharing/GrantMediaItemShareModal';

type RecentMediaSectionProps = {
  nodes: MediaItemSummaryVM[];
  reloadData: () => Promise<void>;
};

export const RecentMediaSection = ({ nodes, reloadData }: RecentMediaSectionProps) => {
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
      operation: ViewerOperation.grantAuthorization,
      label: 'Share',
      onAction: () => setShareMediaOpen(true),
    },
    {
      operation: ViewerOperation.addItems,
      label: 'Add to album',
      onAction: () => setAddToAlbumOpen(true),
    },
    {
      operation: ViewerOperation.removeItems,
      label: 'Delete from library',
      onAction: () => setDeleteMediaOpen(true),
    },
  ];

  const { multiSelectProps, selectedIds, availableActions, clearSelection, selectionCount } =
    useMultiSelectGallery({
      nodes,
      actions: selectableActions,
    });

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
      // Album queries: item counts / cover can change when media is removed from albums (not redundant with recent-media reload).
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
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        availableActions={availableActions}
        Header={() => (
          <>
            <Title>Recent Media</Title>
            <HeaderActions>
              <UploadMediaButton onComplete={reloadData} />
            </HeaderActions>
          </>
        )}
      />

      <SelectableGallery
        nodes={nodes}
        multiSelectProps={multiSelectProps}
        selectableActions={selectableActions.map((x) => x.operation)}
        emptyState={
          <EmptyState
            title="No media yet"
            text="Upload your first media to start building your family gallery"
            action={<UploadMediaButton onComplete={reloadData} />}
          />
        }
        renderItem={({ item, orderedMediaIds }) => (
          <MediaItemTile
            item={item}
            mediaGalleryIds={orderedMediaIds}
            onReactionsRefetch={reloadData}
          />
        )}
      />
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

const Title = styled.h1`
  font-size: 32px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.color.bodyText};
  letter-spacing: -0.5px;
  min-width: 0;

  @media (max-width: 768px) {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.2px;
    flex: 1;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  flex-shrink: 0;
`;
