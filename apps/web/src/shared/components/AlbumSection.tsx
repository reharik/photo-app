import { MediaKind } from '@packages/contracts';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useMultiSelectIds } from '../../hooks/useMultiSelectIds';
import { localizeDate } from '../../lib/formatters/dateFormatters';
import { AlbumItemSummaryVM } from '../../viewModels/album/AlbumItemSummaryVM';
import { AlbumSummaryVM } from '../../viewModels/album/AlbumSummaryVM';
import { EmptyState } from './gallery/EmptyState';
import { AlbumMediaTile } from './gallery/mediaTiles/AlbumMediaTile';
import { SelectableGallery } from './gallery/SelectableGallery';
import { SelectableGalleryHeader } from './gallery/SelectableGalleryHeader';
import { UploadMediaButton } from './UploadMediaButton';

type AlbumSectionProps = {
  album: AlbumSummaryVM;
  albumItems: AlbumItemSummaryVM[];
  refetch: () => void;
};

export const AlbumSection = ({ album, albumItems, refetch }: AlbumSectionProps) => {
  const orderedMediaIds = useMemo(() => albumItems.map((n) => n.id), [albumItems]);
  const { selectionCount, isSelected, handleModifierClick, toggleSelectAt, clearSelection } =
    useMultiSelectIds(orderedMediaIds);

  const renderHeader = () => {
    return (
      <>
        <BackLink to="/albums">← Albums</BackLink>
        <Title>(album?.title ?? 'Album')</Title>
        <HeaderActions>
          <PrimaryButton type="button" disabled={!album}>
            Add album item
          </PrimaryButton>
        </HeaderActions>
      </>
    );
  };

  const renderMetadata = () => {
    return (
      <AlbumMeta>
        <AlbumCover>
          {album.coverMedia ? (
            (() => {
              const coverThumb = album.coverMedia.thumbnailUrl;
              return coverThumb ? (
                <CoverImage src={coverThumb} alt={album.title} />
              ) : (
                <CoverIcon aria-hidden>
                  {album.coverMedia.kind === MediaKind.video ? '🎬' : '🖼️'}
                </CoverIcon>
              );
            })()
          ) : (
            <CoverPlaceholder aria-hidden>📷</CoverPlaceholder>
          )}
        </AlbumCover>
        <AlbumInfo>
          <AlbumTitle>{album.title}</AlbumTitle>
          <AlbumStats>
            <Stat>{albumItems.length} media items</Stat>
          </AlbumStats>
          <AlbumDescription>Updated {localizeDate(album.updatedAt)}</AlbumDescription>
        </AlbumInfo>
      </AlbumMeta>
    );
  };

  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        SelectionActions={() => <div>Hi mom</div>}
        Header={renderHeader}
      />
      {renderMetadata()}
      <SelectableGallery
        nodes={albumItems}
        multiSelectProps={{ isSelected, handleModifierClick, toggleSelectAt }}
        emptyState={
          <EmptyState
            title="No media yet"
            text="Upload your first media to start building your family gallery"
            action={<UploadMediaButton onComplete={refetch} />}
          />
        }
        renderItem={({ item }) => <AlbumMediaTile item={item} />}
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
const AlbumMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(4)};
  margin-bottom: ${({ theme }) => theme.spacing(6)};
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const AlbumCover = styled.div`
  flex-shrink: 0;
  width: 240px;
  aspect-ratio: 4 / 3;
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const CoverPlaceholder = styled.div`
  font-size: 64px;
  opacity: 0.3;
`;

const CoverIcon = styled.div`
  font-size: 64px;
  opacity: 0.35;
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AlbumInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const AlbumTitle = styled.h2`
  font-size: 28px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
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
