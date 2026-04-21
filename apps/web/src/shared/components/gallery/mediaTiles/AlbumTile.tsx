import styled from 'styled-components';
import { localizeDate } from '../../../../lib/formatters/dateFormatters';
import { AlbumSummaryVM } from '../../../../viewModels/album/AlbumSummaryVM';

export const AlbumTile = ({ item }: { item: AlbumSummaryVM }) => {
  const mediaItem = item.coverMedia;
  return (
    <>
      <AlbumThumb>
        {mediaItem ? (
          <ThumbImage src={mediaItem.thumbnailUrl} alt={item.title.trim()} />
        ) : (
          <ThumbIcon aria-hidden>{'🖼️'}</ThumbIcon>
        )}
      </AlbumThumb>
      <MediaInfo>
        <MediaTitle>{item.title.trim()}</MediaTitle>
        <MediaMeta>Updated {localizeDate(item.updatedAt)}</MediaMeta>
      </MediaInfo>
    </>
  );
};
const AlbumThumb = styled.div`
  align-items: center;
  aspect-ratio: 4 / 3;
  color: inherit;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  text-decoration: none;
  width: 100%;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  min-height: 0;
`;

const ThumbIcon = styled.div`
  font-size: 48px;
  opacity: 0.35;
`;

const MediaInfo = styled.div`
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(2)};
`;

const MediaTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const MediaMeta = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.subtext};
`;
