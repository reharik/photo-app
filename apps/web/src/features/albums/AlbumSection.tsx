import { FrontendUploadStatus, Operation } from '@packages/contracts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useUploadQueue } from '../../contexts/UploadQueueContext';
import { PagingState } from '../../hooks/getPaginatedQueryRenderState';
import { UseAppMutationStateResult } from '../../hooks/useAppMutation';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { AppModal } from '../../ui/AppModal';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { EmptyState } from '../../ui/EmptyState';
import { Toast } from '../../ui/Toast';
import { AlbumItemSummaryVM, AlbumSummaryVM, MediaItemSummaryVM } from '../../viewModels/';
import { SelectableGallery } from '../gallery/SelectableGallery';
import { AlbumMediaTile } from '../gallery/tiles/AlbumMediaTile';
import { MediaSelectorSection } from '../media/MediaSelectorSection';
import { UploadMediaButton } from '../media/UploadMediaButton';
import { GrantAlbumShareModal } from '../sharing/GrantAlbumShareModal';
import { GrantMediaItemShareModal } from '../sharing/GrantMediaItemShareModal';
import { AlbumSectionMetadata } from './AlbumSectionMetadata';

const META_COMPACT_AFTER_SCROLL_PX = 32;

type AlbumSectionProps = {
  album: AlbumSummaryVM;
  albumItems: AlbumItemSummaryVM[];
  totalCount: number;
  addAlbumItemState: {
    addItemOpen: boolean;
    setAddItemOpen: (open: boolean) => void;
    submitAddToAlbum: (newAlbumItemIds: string[]) => void;
    pickerMediaItems: MediaItemSummaryVM[];
  };
  removeAlbumItemState: {
    removeItemOpen: boolean;
    setRemoveItemOpen: (open: boolean) => void;
    submitRemoveFromAlbum: (selectedAlbumItemIds: string[]) => void;
    removeFromAlbumMutation: UseAppMutationStateResult;
  };
  modalState: {
    shareAlbumOpen: boolean;
    setShareAlbumOpen: (open: boolean) => void;
    shareItemsOpen: boolean;
    setShareItemsOpen: (open: boolean) => void;
    addCoverItemOpen: boolean;
    setAddCoverItemOpen: (open: boolean) => void;
  };
  retrieveAlbumItems: () => void;
  submitAddAlbumCover: (selectedAlbumItemId: string) => void;
  reloadData: () => void;
  paging: PagingState;
};

export const AlbumSection = ({
  album,
  albumItems,
  totalCount,
  addAlbumItemState,
  removeAlbumItemState,
  modalState,
  submitAddAlbumCover,
  reloadData,
  paging,
}: AlbumSectionProps) => {
  const albumScrollRef = useRef<HTMLDivElement>(null);
  const { sentinelRef, scrollRootRef } = useInfiniteScroll(paging);
  const [metaCompact, setMetaCompact] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | undefined>(undefined);
  const dismissAlbumToast = useCallback((): void => {
    setToastMessage(undefined);
  }, []);

  const selectableActions = [
    {
      operation: Operation.grantAlbumAuthorization,
      label: 'Share',
      onAction: () => modalState.setShareItemsOpen(true),
    },
    {
      operation: Operation.removeItems,
      label: 'Remove from album',
      onAction: () => removeAlbumItemState.setRemoveItemOpen(true),
    },
  ];
  const {
    multiSelectProps,
    selectedItems,
    selectedIds,
    availableActions,
    clearSelection,
    selectionCount,
  } = useMultiSelectGallery({
    nodes: albumItems,
    actions: selectableActions,
  });

  const selectedMediaItemIds = useMemo(
    () => selectedItems.map((item) => item.mediaItem.id),
    [selectedItems],
  );

  const onAlbumScroll = useCallback((): void => {
    const el = albumScrollRef.current;
    if (el == null) {
      return;
    }
    setMetaCompact(el.scrollTop > META_COMPACT_AFTER_SCROLL_PX);
  }, []);

  const { items } = useUploadQueue();

  useEffect(() => {
    if (
      items.some(
        (item) => item.status.equals(FrontendUploadStatus.ready) && item.albumId === album.id,
      )
    )
      void reloadData();
  }, [items, album.id, reloadData]);

  const albumHeaderActions = (
    <HeaderActions>
      {album.operations.includes(Operation.grantAlbumAuthorization) && (
        <SecondaryButton
          type="button"
          disabled={!album}
          onClick={() => {
            modalState.setShareAlbumOpen(true);
          }}
        >
          Share album
        </SecondaryButton>
      )}
      {album.operations.includes(Operation.addItems) && (
        <PrimaryButton
          type="button"
          disabled={!album}
          onClick={() => {
            addAlbumItemState.setAddItemOpen(true);
          }}
        >
          Add items to Album
        </PrimaryButton>
      )}
      {album.operations.includes(Operation.addItems) && (
        <UploadMediaButton albumId={album.id} text="Upload items to album" />
      )}
    </HeaderActions>
  );

  return (
    <Container>
      {toastMessage ? <Toast message={toastMessage} onDismiss={dismissAlbumToast} /> : null}
      <AlbumSectionMetadata
        headerActions={albumHeaderActions}
        selectionCount={selectionCount}
        onClearSelection={clearSelection}
        selectionActions={availableActions}
        count={totalCount}
        album={album}
        metaCompact={metaCompact}
        albumItems={albumItems}
        onSelectCover={submitAddAlbumCover}
        addCoverItemOpen={modalState.addCoverItemOpen}
        setAddCoverItemOpen={modalState.setAddCoverItemOpen}
      />
      <AlbumBodyScroll
        ref={(el) => {
          scrollRootRef.current = el;
          albumScrollRef.current = el;
        }}
        onScroll={onAlbumScroll}
      >
        <SelectableGallery
          nodes={albumItems}
          mediaIdSelector={(x) => x.mediaItem.id}
          multiSelectProps={multiSelectProps}
          embedInParentScroll
          selectableActions={selectableActions}
          emptyState={
            <EmptyState
              title="No album items yet"
              text="Start choosing media items to include to build your gallery"
              action={
                <PrimaryButton
                  type="button"
                  disabled={!album}
                  onClick={() => {
                    addAlbumItemState.setAddItemOpen(true);
                  }}
                >
                  Add items to Album
                </PrimaryButton>
              }
            />
          }
          renderItem={({ item, orderedMediaIds }) => (
            <AlbumMediaTile
              item={item}
              mediaGalleryIds={orderedMediaIds}
              onReactionsRefetch={reloadData}
            />
          )}
        />
        <div ref={sentinelRef} style={{ height: 1 }} />
      </AlbumBodyScroll>
      {removeAlbumItemState.removeItemOpen && (
        <ConfirmationModal
          onClose={() => removeAlbumItemState.setRemoveItemOpen(false)}
          isSubmitting={removeAlbumItemState.removeFromAlbumMutation.isLoading}
          mutationErrors={removeAlbumItemState.removeFromAlbumMutation.errors}
          onConfirm={() => {
            removeAlbumItemState.submitRemoveFromAlbum(selectedIds);
            clearSelection();
          }}
          title="Remove from album?"
          body={
            selectionCount === 1
              ? 'This item will be removed from this album only. Your media will stay in your library.'
              : `These ${selectionCount} items will be removed from this album only. Your media will stay in your library.`
          }
          confirmLabel="Remove from album"
          confirmingLabel="Removing..."
        />
      )}
      {modalState.shareAlbumOpen && (
        <GrantAlbumShareModal
          albumId={album.id}
          onSuccessToast={(message) => setToastMessage(message)}
          onErrorToast={(message) => setToastMessage(message)}
          onClose={() => modalState.setShareAlbumOpen(false)}
        />
      )}
      {modalState.shareItemsOpen && (
        <GrantMediaItemShareModal
          mediaItemIds={selectedMediaItemIds}
          onSuccessToast={(message) => setToastMessage(message)}
          onErrorToast={(message) => setToastMessage(message)}
          onClose={() => {
            modalState.setShareItemsOpen(false);
            clearSelection();
          }}
        />
      )}
      {addAlbumItemState.addItemOpen && (
        <AppModal
          maxWidth="960px"
          showCloseButton={false}
          padding={1}
          onClose={() => {
            clearSelection();
            addAlbumItemState.setAddItemOpen(false);
          }}
        >
          <MediaSelectorSection
            onAddToAlbum={addAlbumItemState.submitAddToAlbum}
            onClose={() => {
              clearSelection();
              addAlbumItemState.setAddItemOpen(false);
            }}
            header={
              <AddAlbumItemModalHeader>
                <AddAlbumItemModalTitle id="add-album-item-modal-title">
                  Add album item
                </AddAlbumItemModalTitle>
                <AddAlbumItemModalClose
                  type="button"
                  onClick={() => {
                    addAlbumItemState.setAddItemOpen(false);
                  }}
                >
                  Close
                </AddAlbumItemModalClose>
              </AddAlbumItemModalHeader>
            }
            nodes={addAlbumItemState.pickerMediaItems}
          />
        </AppModal>
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

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const PrimaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.body};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const AlbumBodyScroll = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: ${({ theme }) => theme.spacing(3)} ${({ theme }) => theme.spacing(6)}
    ${({ theme }) => theme.spacing(6)};
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)}
      ${({ theme }) => theme.spacing(3)};
  }
`;

const AddAlbumItemModalHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(0.5)};
  width: 100%;
`;

const AddAlbumItemModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
`;

const AddAlbumItemModalClose = styled.button`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
  }
`;
