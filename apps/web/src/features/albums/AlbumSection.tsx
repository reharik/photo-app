import { ViewerOperation } from '@packages/contracts';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { UseAppMutationStateResult } from '../../hooks/useAppMutation';
import { useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { AppModal } from '../../ui/AppModal';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { EmptyState } from '../../ui/EmptyState';
import { AlbumItemSummaryVM } from '../../viewModels/album/AlbumItemSummaryVM';
import { AlbumSummaryVM } from '../../viewModels/album/AlbumSummaryVM';
import { MediaItemSummaryVM } from '../../viewModels/media/MediaItemSummaryVM';
import { SelectableGallery } from '../gallery/SelectableGallery';
import { SelectableGalleryHeader } from '../gallery/SelectableGalleryHeader';
import { AlbumMediaTile } from '../gallery/tiles/AlbumMediaTile';
import { MediaSelectorSection } from '../media/MediaSelectorSection';
import { GrantAlbumShareModal } from '../sharing/GrantAlbumShareModal';
import { GrantMediaItemShareModal } from '../sharing/GrantMediaItemShareModal';
import { AlbumSectionMetadata } from './AlbumSectionMetadata';

const META_COMPACT_AFTER_SCROLL_PX = 32;

type AlbumSectionProps = {
  album: AlbumSummaryVM;
  albumItems: AlbumItemSummaryVM[];
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
  shareState: {
    shareAlbumOpen: boolean;
    setShareAlbumOpen: (open: boolean) => void;
    shareItemsOpen: boolean;
    setShareItemsOpen: (open: boolean) => void;
  };
  retrieveAlbumItems: () => void;
  submitAddAlbumCover: (selectedAlbumItemId: string) => void;
};

export const AlbumSection = ({
  album,
  albumItems,
  addAlbumItemState,
  removeAlbumItemState,
  shareState,
  submitAddAlbumCover,
}: AlbumSectionProps) => {
  const albumScrollRef = useRef<HTMLDivElement>(null);
  const [metaCompact, setMetaCompact] = useState(false);

  const selectableActions = [
    {
      operation: ViewerOperation.grantAuthorization,
      label: 'Share',
      onAction: () => shareState.setShareItemsOpen(true),
    },
    {
      operation: ViewerOperation.removeItems,
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

  const renderHeader = () => {
    return (
      <>
        <BackLink to="/albums">← Albums</BackLink>
        <Title>{album?.title ?? 'Album'}</Title>
        <HeaderActions>
          {album.viewerIsOwner && (
            <>
              <SecondaryButton
                type="button"
                disabled={!album}
                onClick={() => {
                  shareState.setShareAlbumOpen(true);
                }}
              >
                Share album
              </SecondaryButton>
              <PrimaryButton
                type="button"
                disabled={!album}
                onClick={() => {
                  addAlbumItemState.setAddItemOpen(true);
                }}
              >
                Add items to Album
              </PrimaryButton>
            </>
          )}
        </HeaderActions>
      </>
    );
  };
  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        availableActions={availableActions}
        Header={renderHeader}
      />
      <AlbumBodyScroll ref={albumScrollRef} onScroll={onAlbumScroll}>
        <AlbumSectionMetadata
          count={albumItems.length}
          album={album}
          metaCompact={metaCompact}
          albumItems={albumItems}
          onSelectCover={submitAddAlbumCover}
        />
        <SelectableGallery
          nodes={albumItems}
          multiSelectProps={multiSelectProps}
          embedInParentScroll
          selectableActions={selectableActions.map((x) => x.operation)}
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
          renderItem={({ item }) => <AlbumMediaTile item={item} />}
        />
      </AlbumBodyScroll>
      {removeAlbumItemState.removeItemOpen && (
        <ConfirmationModal
          onClose={() => removeAlbumItemState.setRemoveItemOpen(false)}
          isSubmitting={removeAlbumItemState.removeFromAlbumMutation.isLoading}
          mutationErrors={removeAlbumItemState.removeFromAlbumMutation.errors}
          onConfirm={() => removeAlbumItemState.submitRemoveFromAlbum(selectedIds)}
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
      {shareState.shareAlbumOpen && (
        <GrantAlbumShareModal
          albumId={album.id}
          onClose={() => shareState.setShareAlbumOpen(false)}
        />
      )}
      {shareState.shareItemsOpen && (
        <GrantMediaItemShareModal
          mediaItemIds={selectedMediaItemIds}
          onClose={() => {
            shareState.setShareItemsOpen(false);
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
          {addAlbumItemState.pickerMediaItems ? (
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
          ) : (
            <EmptyState
              title="No media yet"
              text="Upload your first media to start building your album"
            />
          )}
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

const BackLink = styled(Link)`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.color.border};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.color.bodyRaised};
    color: ${({ theme }) => theme.color.bodyText};
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  flex: 1;
  min-width: 0;
  color: ${({ theme }) => theme.color.bodyText};
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
  padding: 0 ${({ theme }) => theme.spacing(6)} ${({ theme }) => theme.spacing(6)};
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0 ${({ theme }) => theme.spacing(3)} ${({ theme }) => theme.spacing(3)};
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
