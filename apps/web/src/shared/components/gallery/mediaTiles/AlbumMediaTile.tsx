import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AlbumItem } from '../../../../graphql/generated/types';
import { localizeDate } from '../../../../lib/formatters/dateFormatters';

export const AlbumMediaTile = ({ item }: { item: AlbumItem }) => {
  const mediaItem = item.mediaItem;
  const thumbUrl = mediaItem.derivedUrls.thumbnail;
  return (
    <>
      <Link to={`/media/${mediaItem.id}`}>
        {thumbUrl ? (
          <ThumbImage
            src={thumbUrl}
            alt={mediaItem.title?.trim() || mediaItem.originalFileName?.trim()}
          />
        ) : (
          <ThumbIcon aria-hidden>{mediaItem.kind === 'VIDEO' ? '🎬' : '🖼️'}</ThumbIcon>
        )}
      </Link>
      <MediaInfo>
        <MediaTitle>{mediaItem.title?.trim() || mediaItem.originalFileName?.trim()}</MediaTitle>
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
