import { MediaKind } from '@packages/contracts';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { localizeDate } from '../../../../lib/formatters/dateFormatters';
import { MediaItemSummaryVM } from '../../../../viewModels/media/MediaItemSummaryVM';

export const MediaItemTile = ({ item }: { item: MediaItemSummaryVM }) => {
  return (
    <>
      <Link to={`/media/${item.id}`}>
        {item.thumbnailUrl ? (
          <ThumbImage src={item.thumbnailUrl} alt={item.title.trim()} />
        ) : (
          <ThumbIcon aria-hidden>{item.kind === MediaKind.video ? '🎬' : '🖼️'}</ThumbIcon>
        )}
      </Link>
      <MediaInfo>
        <MediaTitle>{item.title?.trim()}</MediaTitle>
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
