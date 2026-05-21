import { MediaAssetKind } from '@packages/contracts';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../../../domain/formatters/mediaItemUrlBuilder';
import { AlbumSummaryVM } from '../../../viewModels/';

export const AlbumTile = ({ item }: { item: AlbumSummaryVM }) => {
  const mediaItem = item.coverMedia;
  const url = mediaItem ? buildMediaItemUrl(mediaItem.id, MediaAssetKind.thumbnail) : undefined;
  return (
    <>
      <ThumbLink to={`/albums/${item.id}`}>
        {url ? (
          <ThumbImage src={url} data-testid={item.coverMedia?.id} alt={item.title.trim()} />
        ) : (
          <ThumbIcon aria-hidden>{'🖼️'}</ThumbIcon>
        )}
      </ThumbLink>
      <CaptionLink to={`/albums/${item.id}`}>
        <MediaInfo>
          <MediaTitle>{item.title.trim()}</MediaTitle>
          <MediaMeta>
            Updated {item.updatedAt ? item.updatedAt.toLocaleString(DateTime.DATE_MED) : ''}
          </MediaMeta>
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
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.borderRadius.md};
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
  color: ${({ theme }) => theme.color.bodyText};
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const MediaMeta = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
