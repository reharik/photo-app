import { EntityType, FrontendUploadStatus, Operation, SortDir } from '@packages/contracts';
import { ArrowUpRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useUploadQueue } from '../../contexts/UploadQueueContext';
import { PagingState } from '../../hooks/getPaginatedQueryRenderState';
import { UseAppMutationStateResult } from '../../hooks/useAppMutation';
import { useInAppNotification } from '../../hooks/useInAppNotification';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { AppModal } from '../../ui/AppModal';
import { Button } from '../../ui/Button';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { EmptyState } from '../../ui/EmptyState';
import { FilmRollMark } from '../../ui/FilmRollMark';
import { Toast } from '../../ui/Toast';
import { AlbumItemSummaryVM, AlbumSummaryVM, MediaItemSummaryVM } from '../../viewModels/';
import { ALBUM_GRID_COLUMNS } from '../media/grid/gridColumns';
import { groupByTakenDatePreservingOrder } from '../media/grid/groupBy/makeDateStrategy';
import { MediaGrid } from '../media/grid/MediaGrid';
import { MediaGridTile } from '../media/grid/MediaGridTile';
import { MediaSelectorSection } from '../media/MediaSelectorSection';
import { GrantAlbumShareModal } from '../sharing/GrantAlbumShareModal';
import { ShellNavIconButton } from '../shell/ShellNavIconButton';
import { AddToAlbumHeaderButton } from './AddToAlbumHeaderButton';
import { AlbumSectionMetadata, type AlbumGroupBy } from './AlbumSectionMetadata';

const META_COMPACT_AFTER_SCROLL_PX = 32;

const albumTakenDateSections = (albumItems: AlbumItemSummaryVM[]) =>
  groupByTakenDatePreservingOrder(albumItems, (item) => item.mediaItem.takenAt);

type AlbumSectionProps = {
  album: AlbumSummaryVM;
  albumItems: AlbumItemSummaryVM[];
  totalCount: number;
  groupBy: AlbumGroupBy;
  sortDir: SortDir;
  onGroupByChange: (groupBy: AlbumGroupBy) => void;
  onSortDirChange: (sortDir: SortDir) => void;
  addAlbumItemState: {
    addItemOpen: boolean;
    setAddItemOpen: (open: boolean) => void;
    submitAddToAlbum: (newAlbumItemIds: string[]) => void;
    pickerMediaItems: MediaItemSummaryVM[];
    pickerPaging: PagingState;
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
  groupBy,
  sortDir,
  onGroupByChange,
  onSortDirChange,
  addAlbumItemState,
  removeAlbumItemState,
  modalState,
  submitAddAlbumCover,
  reloadData,
  paging,
}: AlbumSectionProps) => {
  const albumScrollRef = useRef<HTMLDivElement>(null);
  const { isTargetUnseen } = useInAppNotification();
  const [metaCompact, setMetaCompact] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | undefined>(undefined);
  const dismissAlbumToast = useCallback((): void => {
    setToastMessage(undefined);
  }, []);

  const selectableActions = [
    {
      operation: Operation.removeItems,
      label: 'Remove from album',
      onAction: () => removeAlbumItemState.setRemoveItemOpen(true),
    },
  ];
  const { multiSelectProps, selectedIds, availableActions, clearSelection, selectionCount } =
    useMultiSelectGallery({
      nodes: albumItems,
      actions: selectableActions,
    });

  const isMobileAlbum = useMediaQuery('(max-width: 768px)');

  const onAlbumScroll = useCallback((): void => {
    if (isMobileAlbum) {
      return;
    }
    const el = albumScrollRef.current;
    if (el == null) {
      return;
    }
    setMetaCompact(el.scrollTop > META_COMPACT_AFTER_SCROLL_PX);
  }, [isMobileAlbum]);

  useEffect(() => {
    if (isMobileAlbum) {
      setMetaCompact(false);
    }
  }, [isMobileAlbum]);

  useEffect(() => {
    const el = albumScrollRef.current;
    if (el == null) {
      return;
    }
    el.scrollTop = 0;
    setMetaCompact(false);
  }, [groupBy, sortDir]);

  const takenDateSections = useMemo(() => albumTakenDateSections(albumItems), [albumItems]);

  const groupedSections = useMemo(
    () => (groupBy === 'takenDate' ? takenDateSections : undefined),
    [groupBy, takenDateSections],
  );

  const { items } = useUploadQueue();

  useEffect(() => {
    if (
      items.some(
        (item) => item.status.equals(FrontendUploadStatus.ready) && item.albumId === album.id,
      )
    )
      void reloadData();
  }, [items, album.id, reloadData]);

  const albumHeaderActions = isMobileAlbum ? (
    <>
      {album.operations.includes(Operation.addItems) && (
        <AddToAlbumHeaderButton
          albumId={album.id}
          disabled={!album}
          variant="icon"
          onAddFromLibrary={() => {
            addAlbumItemState.setAddItemOpen(true);
          }}
        />
      )}
      {album.operations.includes(Operation.grantAlbumAuthorization) && (
        <ShellNavIconButton
          type="button"
          aria-label="Share album"
          disabled={!album}
          onClick={() => {
            modalState.setShareAlbumOpen(true);
          }}
        >
          <ArrowUpRight size={20} strokeWidth={2} aria-hidden />
        </ShellNavIconButton>
      )}
    </>
  ) : (
    <HeaderActions>
      {album.operations.includes(Operation.addItems) && (
        <AddToAlbumHeaderButton
          albumId={album.id}
          disabled={!album}
          onAddFromLibrary={() => {
            addAlbumItemState.setAddItemOpen(true);
          }}
        />
      )}
      {album.operations.includes(Operation.grantAlbumAuthorization) && (
        <Button
          type="button"
          variant="secondary"
          size="large"
          disabled={!album}
          onClick={() => {
            modalState.setShareAlbumOpen(true);
          }}
        >
          Share album
        </Button>
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
        groupBy={groupBy}
        sortDir={sortDir}
        onGroupByChange={onGroupByChange}
        onSortDirChange={onSortDirChange}
        onSelectCover={submitAddAlbumCover}
        addCoverItemOpen={modalState.addCoverItemOpen}
        setAddCoverItemOpen={modalState.setAddCoverItemOpen}
      />
      <AlbumBodyScroll
        ref={(el) => {
          albumScrollRef.current = el;
        }}
        onScroll={onAlbumScroll}
      >
        {albumItems.length === 0 ? (
          <EmptyState
            illustration={<FilmRollMark />}
            title="No album items yet"
            text="Start choosing media items to include to build your gallery"
            action={
              <AddToAlbumHeaderButton
                albumId={album.id}
                disabled={!album}
                onAddFromLibrary={() => {
                  addAlbumItemState.setAddItemOpen(true);
                }}
              />
            }
          />
        ) : (
          <GridWrap>
            <MediaGrid
              paging={paging}
              nodes={albumItems}
              getMediaItem={(item) => item.mediaItem}
              multiSelectProps={multiSelectProps}
              selectableActions={selectableActions}
              selectionActive={selectionCount > 0}
              columnCounts={ALBUM_GRID_COLUMNS}
              groupedSections={groupedSections}
              scrollRootRef={albumScrollRef}
              renderItem={(item, ctx) => (
                <MediaGridTile
                  item={item.mediaItem}
                  mediaGalleryIds={ctx.mediaGalleryIds}
                  canReact
                  onReactionsRefetch={reloadData}
                  hasUnseen={isTargetUnseen(EntityType.mediaItem, item.mediaItem.id)}
                />
              )}
            />
          </GridWrap>
        )}
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
            header={
              <AddAlbumItemModalHeader>
                <AddAlbumItemModalTitle id="add-album-item-modal-title">
                  Add album item
                </AddAlbumItemModalTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="small"
                  onClick={() => {
                    addAlbumItemState.setAddItemOpen(false);
                  }}
                >
                  Close
                </Button>
              </AddAlbumItemModalHeader>
            }
            nodes={addAlbumItemState.pickerMediaItems}
            paging={addAlbumItemState.pickerPaging}
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
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const AlbumBodyScroll = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(6)}
    ${({ theme }) => theme.spacing(6)};
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)}
      ${({ theme }) => theme.spacing(3)};
  }
`;

const GridWrap = styled.div`
  width: 100%;
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
  font-family: ${({ theme }) => theme.font.serif};
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
`;
