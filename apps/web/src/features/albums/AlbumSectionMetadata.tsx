import { MediaAssetKind, MediaItemStatus, MediaKind, Operation } from '@packages/contracts';
import { DateTime } from 'luxon';
import { css, styled } from 'styled-components';
import { localizeDate } from '../../domain/formatters/dateFormatters';
import { buildMediaItemUrl } from '../../domain/formatters/mediaItemUrlBuilder';
import { GalleryActionItems } from '../../hooks/useMultiSelectGallery';
import { AppModal } from '../../ui/AppModal';
import { MediaItemSummaryVM, ReactionCountsVM, ViewerReactionVM } from '../../viewModels/';
import { SingleSelectGallery } from '../gallery/SingleSelectGallery';
import { SingleSelectionTile } from '../gallery/tiles/SingleSelectionTile';

type AlbumSectionMetadataProps = {
  count: number;
  album: MinimalAlbumSummaryVM;
  metaCompact: boolean;
  albumItems: MinimalAlbumItemSummaryVM[];
  onSelectCover?: (mediaId: string) => void;
  addCoverItemOpen: boolean;
  setAddCoverItemOpen: (open: boolean) => void;
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
  addCoverItemOpen,
  setAddCoverItemOpen,
}: AlbumSectionMetadataProps) => {
  const isSelecting = selectionCount > 0;
  const selectionLabel = selectionCount === 1 ? '1 selected' : `${selectionCount} selected`;
  const coverMediaUrl = album.coverMedia
    ? buildMediaItemUrl(album.coverMedia.id, MediaAssetKind.thumbnail)
    : undefined;

  const renderCover = () => {
    const cover = album.coverMedia ? (
      <CoverImage src={coverMediaUrl} alt={album.coverMedia?.kind.display ?? ''} />
    ) : (
      <CoverPlaceholder aria-hidden $compact={metaCompact}>
        📷
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
  return (
    <>
      <AlbumMeta $compact={metaCompact}>
        <AlbumMetaContent>
          <AlbumCover $compact={metaCompact}>{renderCover()}</AlbumCover>
          <AlbumInfo $compact={metaCompact}>
            {metaCompact ? (
              <AlbumCompactSummary>
                {`${count} media items ${album.updatedAt ? `· Updated ${album.updatedAt.isValid ? album.updatedAt.toLocaleString(DateTime.DATE_MED) : ''}` : ''}`}
              </AlbumCompactSummary>
            ) : (
              <>
                <AlbumTitle>{album.title}</AlbumTitle>
                <AlbumStats>
                  <Stat>{count} media items</Stat>
                </AlbumStats>
                {album.updatedAt && (
                  <AlbumDescription>
                    Updated{' '}
                    {localizeDate(
                      album.updatedAt.isValid
                        ? album.updatedAt.toLocaleString(DateTime.DATE_MED)
                        : '',
                    )}
                  </AlbumDescription>
                )}
              </>
            )}
          </AlbumInfo>
        </AlbumMetaContent>
        <HeaderTrailing>
          {isSelecting ? (
            <TrailingColumn>
              <SelectionActionGroup>
                {selectionActions.map((action) => (
                  <HeaderActionButton
                    key={action.operation?.key ?? action.label ?? ''}
                    type="button"
                    onClick={action.onAction}
                  >
                    {action.label}
                  </HeaderActionButton>
                ))}
              </SelectionActionGroup>
              <SelectionRow>
                {onClearSelection != null ? (
                  <ClearSelectionButton
                    type="button"
                    onClick={onClearSelection}
                    aria-label="Clear selection"
                  >
                    ✕
                  </ClearSelectionButton>
                ) : null}
                <SelectionCount>{selectionLabel}</SelectionCount>
              </SelectionRow>
            </TrailingColumn>
          ) : (
            headerActions
          )}
        </HeaderTrailing>
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
          {!isPublic && (
            <SingleSelectGallery
              nodes={albumItems}
              renderItem={({ item }) => (
                <SingleSelectionTile
                  item={item.mediaItem as MediaItemSummaryVM}
                  onSelect={() => {
                    onSelectCover?.(item.id);
                    setAddCoverItemOpen(false);
                  }}
                />
              )}
            />
          )}
        </AppModal>
      )}
    </>
  );
};

const AlbumMeta = styled.div<{ $compact: boolean }>`
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

  @media (max-width: 768px) {
    padding: ${({ theme, $compact }) =>
      $compact
        ? `${theme.spacing(2)} ${theme.spacing(3)}`
        : `${theme.spacing(3)} ${theme.spacing(3)} ${theme.spacing(2)}`};
    flex-direction: ${({ $compact }) => ($compact ? 'row' : 'column')};
    align-items: ${({ $compact }) => ($compact ? 'center' : 'stretch')};
  }
`;

const AlbumCover = styled.div<{ $compact: boolean }>`
  flex-shrink: 0;
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme, $compact }) =>
    $compact ? theme.borderRadius.md : theme.borderRadius.lg};
  display: flex;
  align-items: start;
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

const AlbumMetaContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  flex: 1;
  min-width: 0;
  align-self: center;
`;

const HeaderTrailing = styled.div`
  display: flex;
  flex-shrink: 0;
  align-self: flex-start;
`;

const TrailingColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SelectionRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SelectionCount = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ClearSelectionButton = styled.button`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.bodyRaised};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.color.body};
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
`;

const SelectionActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-wrap: wrap;
  justify-content: flex-start;
`;

const HeaderActionButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }
`;
