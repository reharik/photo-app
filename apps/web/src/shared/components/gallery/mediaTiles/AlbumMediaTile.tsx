import { MediaKind } from '@packages/contracts';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { localizeDate } from '../../../../lib/formatters/dateFormatters';
import { AlbumItemSummaryVM } from '../../../../viewModels/album/AlbumItemSummaryVM';

export const AlbumMediaTile = ({ item }: { item: AlbumItemSummaryVM }) => {
  const mediaItem = item.mediaItem;
  return (
    <>
      <Link to={`/media/${mediaItem.id}`}>
        {mediaItem.thumbnailUrl ? (
          <ThumbImage src={mediaItem.thumbnailUrl} alt={mediaItem.title.trim()} />
        ) : (
          <ThumbIcon aria-hidden>{mediaItem.kind === MediaKind.video ? '🎬' : '🖼️'}</ThumbIcon>
        )}
      </Link>
      <MediaInfo>
        <MediaTitle>{mediaItem.title.trim()}</MediaTitle>
        <MediaMeta>{localizeDate(mediaItem.createdAt)}</MediaMeta>
      </MediaInfo>
    </>
  );
};

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbIcon = styled.div`
  font-size: 48px;
  opacity: 0.35;
`;

const MediaInfo = styled.div`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(0.5)};
`;

const MediaTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const MediaMeta = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.subtext};
`;
