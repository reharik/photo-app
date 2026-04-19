import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { MediaItem } from '../../../../graphql/generated/types';
import { localizeDate } from '../../../../lib/formatters/dateFormatters';

export const MediaItemTile = ({ item, thumbUrl }: { item: MediaItem; thumbUrl: string }) => {
  return (
    <>
      <Link to={`/media/${item.id}`}>
        {thumbUrl ? (
          <ThumbImage src={thumbUrl} alt={item.title?.trim() || item.originalFileName?.trim()} />
        ) : (
          <ThumbIcon aria-hidden>{item.kind === 'VIDEO' ? '🎬' : '🖼️'}</ThumbIcon>
        )}
      </Link>
      <MediaInfo>
        <MediaTitle>{item.title?.trim() || item.originalFileName?.trim()}</MediaTitle>
        <MediaMeta>{localizeDate(item.createdAt)}</MediaMeta>
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
