import { MediaAssetKind, MediaKind } from '@packages/contracts';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../../../domain/formatters/mediaItemUrlBuilder';
import { MinimalAlbumItemSummaryVM } from '../../albums/AlbumSectionMetadata';

export const AlbumMediaTile = ({ item }: { item: MinimalAlbumItemSummaryVM }) => {
  const mediaItem = item.mediaItem;
  const url = buildMediaItemUrl(mediaItem.id, MediaAssetKind.thumbnail);
  return (
    <>
      <ThumbLink to={`/media/${mediaItem.id}`}>
        {mediaItem.kind === MediaKind.photo ? (
          <ThumbImage src={url} alt={mediaItem.title?.trim() ?? ''} />
        ) : (
          <ThumbIcon aria-hidden>{'🎬'}</ThumbIcon>
        )}
      </ThumbLink>
      <CaptionLink to={`/media/${mediaItem.id}`}>
        <MediaInfo>
          <MediaTitle>{mediaItem.title?.trim() ?? ''}</MediaTitle>
          <MediaMeta>
            {mediaItem.createdAt ? mediaItem.createdAt.toLocaleString(DateTime.DATE_MED) : ''}
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
