import { useApolloClient, useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  AddMediaItemsToAlbumDocument,
  type AddMediaItemsToAlbumMutation,
  DeleteMediaItemsDocument,
  type DeleteMediaItemsMutation,
  ViewerAlbumsDocument,
} from '../../graphql/generated/types';
import { useMultiSelectIds } from '../../hooks/useMultiSelectIds';
import { MediaItemSummaryVM } from '../../viewModels/media/MediaItemSummaryVM';
import { useAppMutationState } from './dataAccess/useAppMutation';
import { AddToAlbumModal } from './gallery/AddToAlbumModal';
import { DeleteMediaConfirmModal } from './gallery/DeleteMediaConfirmModal';
import { EmptyState } from './gallery/EmptyState';
import { MediaItemTile } from './gallery/mediaTiles/MediaItemTile';
import { SelectableGallery } from './gallery/SelectableGallery';
import { SelectableGalleryHeader } from './gallery/SelectableGalleryHeader';
import { MediaSelectionToolbar } from './gallery/selectionActions/MediaSelectionToolbar';
import { UploadMediaButton } from './UploadMediaButton';

type RecentMediaSectionProps = {
  nodes: MediaItemSummaryVM[];
  reloadData: () => void;
};

export const RecentMediaSection = ({ nodes, reloadData }: RecentMediaSectionProps) => {
  const client = useApolloClient();
  const orderedMediaIds = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const {
    selectedIds,
    selectionCount,
    isSelected,
    handleModifierClick,
    toggleSelectAt,
    clearSelection,
  } = useMultiSelectIds(orderedMediaIds);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
  const [deleteMediaOpen, setDeleteMediaOpen] = useState(false);
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

  const albumOptions = useMemo(
    () =>
      albumsQuery.data?.viewer?.albums.nodes.map((n) => ({
        id: n.id,
        title: n.title,
      })) ?? [],
    [albumsQuery.data],
  );

  const mediaItemIdsForModal = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const submitDeleteMedia = async (): Promise<void> => {
    const result = await executeDelete(
      {
        mutation: DeleteMediaItemsDocument,
        variables: {
          input: { mediaItemIds: mediaItemIdsForModal },
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
            mediaItemIds: mediaItemIdsForModal,
            ...input,
          },
        },
      },
      (data: AddMediaItemsToAlbumMutation) => data.AddMediaItemsToAlbum,
    );

    if (result.success) {
      setAddToAlbumOpen(false);
      clearSelection();
      void reloadData();
      await client.refetchQueries({ include: [ViewerAlbumsDocument] });
    }
  };

  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        SelectionActions={
          <MediaSelectionToolbar
            onAddToAlbum={() => setAddToAlbumOpen(true)}
            onDeleteFromLibrary={() => setDeleteMediaOpen(true)}
          />
        }
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
        multiSelectProps={{ isSelected, handleModifierClick, toggleSelectAt }}
        emptyState={
          <EmptyState
            title="No media yet"
            text="Upload your first media to start building your family gallery"
            action={<UploadMediaButton onComplete={reloadData} />}
          />
        }
        renderItem={({ item, orderedMediaIds }) => (
          <MediaItemTile item={item} mediaGalleryIds={orderedMediaIds} />
        )}
        orderedMediaIds={orderedMediaIds}
      />

      <AddToAlbumModal
        open={addToAlbumOpen}
        onClose={() => setAddToAlbumOpen(false)}
        mediaItemCount={mediaItemIdsForModal.length}
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

      <DeleteMediaConfirmModal
        open={deleteMediaOpen}
        onClose={() => setDeleteMediaOpen(false)}
        itemCount={mediaItemIdsForModal.length}
        isSubmitting={isDeleteLoading}
        mutationErrors={deleteErrors}
        onConfirm={submitDeleteMedia}
      />
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
  color: ${({ theme }) => theme.colors.text};
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
