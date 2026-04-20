import { MediaKind } from '@packages/contracts';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { localizeDate } from '../../../../lib/formatters/dateFormatters';
import { MediaItemSummaryVM } from '../../../../viewModels/media/MediaItemSummaryVM';

export const MediaItemTile = ({
  item,
  mediaGalleryIds,
}: {
  item: MediaItemSummaryVM;
  mediaGalleryIds: string[];
}) => {
  return (
    <>
      <ThumbLink to={`/media/${item.id}`} state={{ mediaGalleryIds }}>
        {item.thumbnailUrl ? (
          <ThumbImage src={item.thumbnailUrl} alt={item.title.trim()} />
        ) : (
          <ThumbIcon aria-hidden>{item.kind === MediaKind.video ? '🎬' : '🖼️'}</ThumbIcon>
        )}
      </ThumbLink>
      <CaptionLink to={`/media/${item.id}`}>
        <MediaInfo>
          <MediaTitle>{item.title?.trim()}</MediaTitle>
          <MediaMeta>{localizeDate(item.createdAt)}</MediaMeta>
        </MediaInfo>
      </CaptionLink>
    </>
  );
};

const ThumbLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  aspect-ratio: 4 / 3;
  flex-shrink: 0;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
`;

const CaptionLink = styled(Link)`
  display: block;
  color: inherit;
  text-decoration: none;
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
