import { MediaAssetKind } from '@packages/contracts';
import { useState } from 'react';
import { css, styled } from 'styled-components';
import { localizeDate } from '../../lib/formatters/dateFormatters';
import { buildMediaItemUrl } from '../../lib/urlBuilders/mediaItemUrlBuilder';
import { AlbumItemSummaryVM } from '../../viewModels/album/AlbumItemSummaryVM';
import { AlbumSummaryVM, UserAlbumSummaryVM } from '../../viewModels/album/AlbumSummaryVM';
import { UserMediaItemSummaryVM } from '../../viewModels/media/MediaItemSummaryVM';
import { SingleSelectionTile } from './gallery/mediaTiles/SingleSelectionTile';
import { SingleSelectGallery } from './gallery/SingleSelectGallery';
import { AppModal } from './ui/AppModal';

type AlbumSectionMetadataProps = {
  count: number;
  album: AlbumSummaryVM;
  metaCompact: boolean;
  albumItems: AlbumItemSummaryVM[];
  onSelectCover?: (mediaId: string) => void;
  isPublic?: boolean;
};

export const AlbumSectionMetadata = ({
  count,
  album,
  metaCompact,
  albumItems,
  onSelectCover,
  isPublic,
}: AlbumSectionMetadataProps) => {
  const [addCoverItemOpen, setAddCoverItemOpen] = useState(false);
  const coverMediaUrl = album.coverMedia
    ? buildMediaItemUrl(album.coverMedia.id, MediaAssetKind.thumbnail)
    : undefined;
  return (
    <>
      <AlbumMeta $compact={metaCompact}>
        <AlbumCover $compact={metaCompact}>
          <CoverUploadButton type="button" onClick={() => setAddCoverItemOpen(true)}>
            {album.coverMedia ? (
              <CoverImage src={coverMediaUrl} alt={album.coverMedia?.kind.display ?? ''} />
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
              {`${count} media items ${(album as UserAlbumSummaryVM).updatedAt ? `· Updated ${localizeDate((album as UserAlbumSummaryVM).updatedAt)}` : ''}`}
            </AlbumCompactSummary>
          ) : (
            <>
              <AlbumTitle>{album.title}</AlbumTitle>
              <AlbumStats>
                <Stat>{count} media items</Stat>
              </AlbumStats>
              {(album as UserAlbumSummaryVM).updatedAt && (
                <AlbumDescription>
                  Updated {localizeDate((album as UserAlbumSummaryVM).updatedAt)}
                </AlbumDescription>
              )}
            </>
          )}
        </AlbumInfo>
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
                  item={item.mediaItem as UserMediaItemSummaryVM}
                  onSelect={() => onSelectCover?.(item.id)}
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
  color: ${({ theme }) => theme.colors.text};
`;

const AddAlbumCoverModalClose = styled.button`
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
