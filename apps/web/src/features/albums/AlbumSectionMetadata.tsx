import { MediaAssetKind, MediaItemStatus, MediaKind, Operation } from '@packages/contracts';
import { Camera } from 'lucide-react';
import { DateTime } from 'luxon';
import { css, styled } from 'styled-components';
import { localizeDate } from '../../domain/formatters/dateFormatters';
import { buildMediaItemUrl } from '../../domain/formatters/mediaItemUrlBuilder';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { GalleryActionItems } from '../../hooks/useMultiSelectGallery';
import { AppModal } from '../../ui/AppModal';
import { ReactionCountsVM, ViewerReactionVM } from '../../viewModels/';
import { PICKER_GRID_COLUMNS } from '../media/grid/gridColumns';
import { MediaGrid } from '../media/grid/MediaGrid';
import type { MultiSelectProps } from '../media/grid/types';
import { buildAlbumBrowseSubtitle } from './albumBrowseSubtitle';
import { AlbumSelectionActions } from './AlbumSelectionActions';

type AlbumSectionMetadataProps = {
  count: number;
  album: MinimalAlbumSummaryVM;
  metaCompact: boolean;
  albumItems: MinimalAlbumItemSummaryVM[];
  onSelectCover?: (mediaId: string) => void;
  addCoverItemOpen?: boolean;
  setAddCoverItemOpen?: (open: boolean) => void;
  isPublic?: boolean;
  headerActions?: React.ReactNode;
  selectionCount?: number;
  onClearSelection?: () => void;
  selectionActions?: GalleryActionItems[];
};

export type MinimalAlbumSummaryVM = {
  id: string;
  title?: string;
  coverMedia?: MinimalMediaItemSummaryVM;
  itemCount: number;
  updatedAt?: DateTime;
  operations: Operation[];
};

export type MinimalMediaItemSummaryVM = {
  id: string;
  title?: string;
  kind: MediaKind;
  createdAt?: DateTime;
  status?: MediaItemStatus;
  reactionCounts: ReactionCountsVM;
  viewerReactions?: ViewerReactionVM[];
};

export type MinimalAlbumItemSummaryVM = {
  id: string;
  mediaItem: MinimalMediaItemSummaryVM;
  orderIndex: string;
  updatedAt?: DateTime;
  operations: Operation[];
};

const MOBILE_ALBUM_MEDIA = '(max-width: 768px)';

const noopMultiSelect: MultiSelectProps = {
  isSelected: () => false,
  handleModifierClick: () => undefined,
  toggleSelectAt: () => undefined,
  enterSelectionAt: () => undefined,
};

export const AlbumSectionMetadata = ({
  count,
  album,
  metaCompact,
  albumItems,
  onSelectCover,
  isPublic,
  headerActions,
  selectionCount = 0,
  onClearSelection,
  selectionActions = [],
  addCoverItemOpen = false,
  setAddCoverItemOpen = () => {},
}: AlbumSectionMetadataProps) => {
  const isMobileAlbum = useMediaQuery(MOBILE_ALBUM_MEDIA);
  const isSelecting = selectionCount > 0;
  const showMobileBrowse = isMobileAlbum && !isSelecting;
  const showMobileSelection = isMobileAlbum && isSelecting;
  const coverMediaUrl = album.coverMedia
    ? buildMediaItemUrl(album.coverMedia.id, MediaAssetKind.thumbnail)
    : undefined;

  const renderCover = () => {
    const cover = album.coverMedia ? (
      <CoverImage
        src={coverMediaUrl}
        data-testid={album.coverMedia.id}
        alt={album.coverMedia?.kind.display ?? ''}
      />
    ) : (
      <CoverPlaceholder aria-hidden $compact={metaCompact}>
        <Camera size={metaCompact ? 18 : 28} strokeWidth={1.75} aria-hidden />
      </CoverPlaceholder>
    );
    return album.operations.includes(Operation.editCover) ? (
      <CoverUploadButton type="button" onClick={() => setAddCoverItemOpen(true)}>
        {cover}
      </CoverUploadButton>
    ) : (
      <>{cover}</>
    );
  };

  const renderSelectionActions = () =>
    onClearSelection != null ? (
      <AlbumSelectionActions
        selectionCount={selectionCount}
        onClearSelection={onClearSelection}
        selectionActions={selectionActions}
      />
    ) : null;

  const handleCoverTileClick = (mediaItemId: string): void => {
    const albumItem = albumItems.find((item) => item.mediaItem.id === mediaItemId);
    if (albumItem == null) {
      return;
    }
    onSelectCover?.(albumItem.id);
    setAddCoverItemOpen(false);
  };

  return (
    <>
      <AlbumMeta
        $compact={metaCompact}
        $mobileBrowse={showMobileBrowse}
        $mobileSelection={showMobileSelection}
      >
        {showMobileBrowse ? (
          <MobileBrowseHeader>
            <MobileBrowseTitleRow>
              <MobileBrowseTitle>{album.title}</MobileBrowseTitle>
              {headerActions != null ? (
                <MobileBrowseActions>{headerActions}</MobileBrowseActions>
              ) : null}
            </MobileBrowseTitleRow>
            <MobileBrowseSubtitle>{buildAlbumBrowseSubtitle(count, album.updatedAt)}</MobileBrowseSubtitle>
          </MobileBrowseHeader>
        ) : showMobileSelection ? (
          renderSelectionActions()
        ) : (
          <>
            <AlbumMetaPrimary $compact={metaCompact}>
              <AlbumCover $compact={metaCompact}>{renderCover()}</AlbumCover>
              <AlbumInfo $compact={metaCompact}>
                {metaCompact ? (
                  <AlbumCompactSummary>
                    {buildAlbumBrowseSubtitle(count, album.updatedAt)}
                  </AlbumCompactSummary>
                ) : (
                  <>
                    <AlbumTitle>{album.title}</AlbumTitle>
                    <AlbumStats>
                      <Stat>{count === 1 ? '1 item' : `${count} items`}</Stat>
                    </AlbumStats>
                    {album.updatedAt?.isValid ? (
                      <AlbumDescription>
                        Updated {localizeDate(album.updatedAt.toLocaleString(DateTime.DATE_MED))}
                      </AlbumDescription>
                    ) : null}
                  </>
                )}
              </AlbumInfo>
            </AlbumMetaPrimary>
            <HeaderTrailing $selecting={isSelecting}>
              {isSelecting ? renderSelectionActions() : headerActions}
            </HeaderTrailing>
          </>
        )}
      </AlbumMeta>
      {addCoverItemOpen && (
        <AppModal
          maxWidth="960px"
          showCloseButton={false}
          padding={1}
          onClose={() => {
            setAddCoverItemOpen(false);
          }}
          title={
            <AddAlbumCoverModalHeader>
              <AddAlbumCoverModalTitle>Select album Cover</AddAlbumCoverModalTitle>
              <AddAlbumCoverModalClose
                type="button"
                onClick={() => {
                  setAddCoverItemOpen(false);
                }}
              >
                Cancel
              </AddAlbumCoverModalClose>
            </AddAlbumCoverModalHeader>
          }
        >
          {!isPublic ? (
            <CoverPickerGridWrap>
              <MediaGrid
                nodes={albumItems}
                toDisplayable={(item) => item.mediaItem}
                multiSelectProps={noopMultiSelect}
                selectableActions={[]}
                selectable={false}
                selectionActive={false}
                columnCounts={PICKER_GRID_COLUMNS}
                groupBy="none"
                tileFit="contain"
                disableTileNavigation
                canReact={false}
                handleTileNavigate={handleCoverTileClick}
              />
            </CoverPickerGridWrap>
          ) : null}
        </AppModal>
      )}
    </>
  );
};

const AlbumMeta = styled.div<{
  $compact: boolean;
  $mobileBrowse: boolean;
  $mobileSelection: boolean;
}>`
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme, $compact }) => theme.spacing($compact ? 2 : 3)};
  padding: ${({ theme, $compact }) =>
    $compact
      ? `${theme.spacing(2)} ${theme.spacing(6)}`
      : `${theme.spacing(4)} ${theme.spacing(6)} ${theme.spacing(3)}`};
  background: ${({ theme }) => theme.color.body};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  box-sizing: border-box;
  transition:
    gap 180ms ease,
    padding 180ms ease;

  ${({ $mobileBrowse, theme }) =>
    $mobileBrowse
      ? css`
          padding: ${theme.spacing(1.5)} ${theme.spacing(3)} ${theme.spacing(1.25)};
        `
      : ''}

  ${({ $mobileSelection, theme }) =>
    $mobileSelection
      ? css`
          padding: ${theme.spacing(1.5)} ${theme.spacing(3)};
        `
      : ''}
`;

const MobileBrowseHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
  width: 100%;
  min-width: 0;
`;

const MobileBrowseTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

const MobileBrowseTitle = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._18};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  letter-spacing: -0.02em;
  line-height: 1.2;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MobileBrowseSubtitle = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._13};
  line-height: 1.4;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MobileBrowseActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.25)};
  flex-shrink: 0;
`;

const AlbumCover = styled.div<{ $compact: boolean }>`
  flex-shrink: 0;
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme, $compact }) =>
    $compact ? theme.borderRadius.md : theme.borderRadius.lg};
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
        `}
`;

const CoverPlaceholder = styled.div<{ $compact: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.color.bodyElevated};
  color: ${({ theme }) => theme.color.bodyTextMuted};
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
  display: block;
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
  color: ${({ theme }) => theme.color.bodyText};
`;

const AlbumCompactSummary = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AlbumStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  font-size: 14px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const Stat = styled.span``;

const AlbumDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  line-height: 1.6;
`;

const AddAlbumCoverModalHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(0.5)};
  width: 100%;
`;

const AddAlbumCoverModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
`;

const CoverPickerGridWrap = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const AddAlbumCoverModalClose = styled.button`
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

const AlbumMetaPrimary = styled.div<{ $compact: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  flex: 1;
  min-width: 0;
  align-self: center;
`;

const HeaderTrailing = styled.div<{ $selecting: boolean }>`
  display: flex;
  flex-shrink: 1;
  align-self: flex-start;
  min-width: 0;
  max-width: 100%;
`;
