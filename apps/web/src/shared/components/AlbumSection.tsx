import { useApolloClient, useQuery } from '@apollo/client/react';
import type { MouseEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import {
  AddMediaItemsToAlbumDocument,
  type AddMediaItemsToAlbumMutation,
  DeleteAlbumItemsFromAlbumDocument,
  type DeleteAlbumItemsFromAlbumMutation,
  ViewerAlbumsDocument,
  ViewerRecentMediaDocument,
} from '../../graphql/generated/types';
import { useMultiSelectIds } from '../../hooks/useMultiSelectIds';
import { localizeDate } from '../../lib/formatters/dateFormatters';
import { AlbumItemSummaryVM } from '../../viewModels/album/AlbumItemSummaryVM';
import { AlbumSummaryVM } from '../../viewModels/album/AlbumSummaryVM';
import { mapMultipleMediaItemsToMediaItemSummaryVMs } from '../../viewModels/media/mapMediaItemToMediaItemSummaryVM';
import { getQueryRenderState } from './dataAccess/getQueryRenderState';
import { useAppMutationState } from './dataAccess/useAppMutation';
import { AddToAlbumModal } from './gallery/AddToAlbumModal';
import { EmptyState } from './gallery/EmptyState';
import { AlbumMediaTile } from './gallery/mediaTiles/AlbumMediaTile';
import { RemoveFromAlbumConfirmModal } from './gallery/RemoveFromAlbumConfirmModal';
import { SelectableGallery } from './gallery/SelectableGallery';
import { SelectableGalleryHeader } from './gallery/SelectableGalleryHeader';
import { MediaSelectionToolbar } from './gallery/selectionActions/MediaSelectionToolbar';
import { MediaSelectorSection } from './MediaSelectorSection';
import { UploadMediaButton } from './UploadMediaButton';

const META_COMPACT_AFTER_SCROLL_PX = 32;

type AlbumSectionProps = {
  album: AlbumSummaryVM;
  albumItems: AlbumItemSummaryVM[];
  refetch: () => void;
};

export const AlbumSection = ({ album, albumItems, refetch }: AlbumSectionProps) => {
  const client = useApolloClient();
  const albumScrollRef = useRef<HTMLDivElement>(null);
  const [metaCompact, setMetaCompact] = useState(false);
  const orderedMediaIds = useMemo(() => albumItems.map((n) => n.id), [albumItems]);
  const {
    selectedIds,
    selectionCount,
    isSelected,
    handleModifierClick,
    toggleSelectAt,
    clearSelection,
  } = useMultiSelectIds(orderedMediaIds);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
  const [addAlbumItemModalOpen, setAddAlbumItemModalOpen] = useState(false);
  const [removeFromAlbumOpen, setRemoveFromAlbumOpen] = useState(false);
  const { isLoading, errors, execute } = useAppMutationState();
  const {
    isLoading: isRemoveLoading,
    errors: removeErrors,
    execute: executeRemove,
  } = useAppMutationState();

  const albumsQuery = useQuery(ViewerAlbumsDocument, {
    skip: !addToAlbumOpen,
    fetchPolicy: 'cache-first',
  });

  const recentMediaForPickerQuery = useQuery(ViewerRecentMediaDocument, {
    skip: !addAlbumItemModalOpen,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { data: pickerMediaNodes, content: pickerMediaContent } = getQueryRenderState({
    query: recentMediaForPickerQuery,
    select: (d) => d.viewer?.mediaItems.nodes,
    map: mapMultipleMediaItemsToMediaItemSummaryVMs,
  });

  const albumOptions = useMemo(
    () =>
      (albumsQuery.data?.viewer?.albums.nodes ?? [])
        .filter((n) => n.id !== album.id)
        .map((n) => ({ id: n.id, title: n.title })),
    [albumsQuery.data, album.id],
  );

  const selectedAlbumItemIds = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const selectedMediaItemIds = useMemo(() => {
    const list: string[] = [];
    for (const albumItemId of selectedIds) {
      const row = albumItems.find((i) => i.id === albumItemId);
      if (row) {
        list.push(row.mediaItem.id);
      }
    }
    return list;
  }, [albumItems, selectedIds]);

  const submitAddToAlbum = async (input: { albumId?: string; newAlbum?: { title: string } }) => {
    const result = await execute(
      {
        mutation: AddMediaItemsToAlbumDocument,
        variables: {
          input: {
            mediaItemIds: selectedMediaItemIds,
            ...input,
          },
        },
      },
      (data: AddMediaItemsToAlbumMutation) => data.AddMediaItemsToAlbum,
    );

    if (result.success) {
      setAddToAlbumOpen(false);
      clearSelection();
      void refetch();
      await client.refetchQueries({ include: [ViewerAlbumsDocument] });
    }
  };

  const submitRemoveFromAlbum = async () => {
    const result = await executeRemove(
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
      clearSelection();
      void refetch();
    }
  };

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
          <PrimaryButton
            type="button"
            disabled={!album}
            onClick={() => {
              setAddAlbumItemModalOpen(true);
            }}
          >
            Add items to Album
          </PrimaryButton>
        </HeaderActions>
      </>
    );
  };

  const renderMetadata = () => {
    const uploadCoverMedia = () => {
      alert('uploadCoverMedia');
    };
    return (
      <AlbumMeta $compact={metaCompact}>
        <AlbumCover $compact={metaCompact}>
          <CoverUploadButton type="button" onClick={uploadCoverMedia}>
            {album.coverMedia ? (
              <CoverImage src={album.coverMedia.thumbnailUrl} alt={album.coverMedia.title ?? ''} />
            ) : (
              <CoverPlaceholder aria-hidden $compact={metaCompact}>
                📷
              </CoverPlaceholder>
            )}
          </CoverUploadButton>
        </AlbumCover>
        <AlbumInfo $compact={metaCompact}>
          {metaCompact ? (
            <AlbumCompactSummary>
              {albumItems.length} media items · Updated {localizeDate(album.updatedAt)}
            </AlbumCompactSummary>
          ) : (
            <>
              <AlbumTitle>{album.title}</AlbumTitle>
              <AlbumStats>
                <Stat>{albumItems.length} media items</Stat>
              </AlbumStats>
              <AlbumDescription>Updated {localizeDate(album.updatedAt)}</AlbumDescription>
            </>
          )}
        </AlbumInfo>
      </AlbumMeta>
    );
  };

  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        SelectionActions={
          <MediaSelectionToolbar
            onAddToAlbum={() => setAddToAlbumOpen(true)}
            onRemoveFromAlbum={() => setRemoveFromAlbumOpen(true)}
          />
        }
        Header={renderHeader}
      />
      <AlbumBodyScroll ref={albumScrollRef} onScroll={onAlbumScroll}>
        {renderMetadata()}
        <SelectableGallery
          nodes={albumItems}
          multiSelectProps={{ isSelected, handleModifierClick, toggleSelectAt }}
          orderedMediaIds={orderedMediaIds}
          embedInParentScroll
          emptyState={
            <EmptyState
              title="No media yet"
              text="Upload your first media to start building your family gallery"
              action={<UploadMediaButton onComplete={refetch} />}
            />
          }
          renderItem={({ item }) => <AlbumMediaTile item={item} />}
        />
      </AlbumBodyScroll>

      <AddToAlbumModal
        open={addToAlbumOpen}
        onClose={() => setAddToAlbumOpen(false)}
        mediaItemCount={selectedMediaItemIds.length}
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

      <RemoveFromAlbumConfirmModal
        open={removeFromAlbumOpen}
        onClose={() => setRemoveFromAlbumOpen(false)}
        itemCount={selectedAlbumItemIds.length}
        isSubmitting={isRemoveLoading}
        mutationErrors={removeErrors}
        onConfirm={submitRemoveFromAlbum}
      />

      {addAlbumItemModalOpen ? (
        <AddAlbumItemModalBackdrop
          role="presentation"
          onClick={() => {
            setAddAlbumItemModalOpen(false);
          }}
        >
          <AddAlbumItemModalPanel
            role="dialog"
            aria-labelledby="add-album-item-modal-title"
            onClick={(e: MouseEvent<HTMLDivElement>) => {
              e.stopPropagation();
            }}
          >
            <AddAlbumItemModalBody>
              {pickerMediaNodes ? (
                <MediaSelectorSection
                  header={
                    <AddAlbumItemModalHeader>
                      <AddAlbumItemModalTitle id="add-album-item-modal-title">
                        Add album item
                      </AddAlbumItemModalTitle>
                      <AddAlbumItemModalClose
                        type="button"
                        onClick={() => {
                          setAddAlbumItemModalOpen(false);
                        }}
                      >
                        Close
                      </AddAlbumItemModalClose>
                    </AddAlbumItemModalHeader>
                  }
                  nodes={pickerMediaNodes}
                />
              ) : (
                pickerMediaContent
              )}
            </AddAlbumItemModalBody>
          </AddAlbumItemModalPanel>
        </AddAlbumItemModalBackdrop>
      ) : null}
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
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.subtext};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.panel};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  flex: 1;
  min-width: 0;
  color: ${({ theme }) => theme.colors.text};
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const PrimaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.bg};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
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

const AlbumMeta = styled.div<{ $compact: boolean }>`
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme, $compact }) => theme.spacing($compact ? 2 : 3)};
  margin-bottom: ${({ theme, $compact }) => theme.spacing($compact ? 3 : 4)};
  padding: ${({ theme, $compact }) =>
    $compact ? `${theme.spacing(2)} 0` : `${theme.spacing(3)} 0 ${theme.spacing(2)}`};
  background: ${({ theme }) => theme.colors.bg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  box-sizing: border-box;
  transition:
    gap 180ms ease,
    padding 180ms ease,
    margin-bottom 180ms ease;

  @media (max-width: 768px) {
    flex-direction: ${({ $compact }) => ($compact ? 'row' : 'column')};
    align-items: ${({ $compact }) => ($compact ? 'center' : 'stretch')};
  }
`;

const AlbumCover = styled.div<{ $compact: boolean }>`
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme, $compact }) => ($compact ? theme.radius.md : theme.radius.lg)};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  ${({ $compact }) =>
    $compact
      ? css`
          width: 52px;
          height: 52px;
        `
      : css`
          width: 180px;
          aspect-ratio: 4 / 3;

          @media (max-width: 768px) {
            width: 100%;
            max-width: 220px;
            margin-inline: auto;
          }
        `}
`;

const CoverPlaceholder = styled.div<{ $compact: boolean }>`
  font-size: ${({ $compact }) => ($compact ? '24px' : 'clamp(32px, min(10vw, 15vh), 56px)')};
  line-height: 1;
  opacity: 0.35;
`;

const CoverUploadButton = styled.button`
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AlbumInfo = styled.div<{ $compact: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $compact }) => theme.spacing($compact ? 0.5 : 1.5)};
  flex: 1;
  min-width: 0;
  justify-content: center;
`;

const AlbumTitle = styled.h2`
  font-size: 22px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
`;

const AlbumCompactSummary = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.subtext};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AlbumStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.subtext};
`;

const Stat = styled.span``;

const AlbumDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.subtext};
  line-height: 1.6;
`;

const AddAlbumItemModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: ${({ theme }) => theme.spacing(3)};
`;

const AddAlbumItemModalPanel = styled.div`
  width: 100%;
  max-width: 960px;
  max-height: 85vh;
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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
  color: ${({ theme }) => theme.colors.text};
`;

const AddAlbumItemModalClose = styled.button`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const AddAlbumItemModalBody = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  /* padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(4)} ${theme.spacing(4)}`}; */
  display: flex;
  flex-direction: column;
`;
