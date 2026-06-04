import { MediaAssetKind, MediaKind, ReactionTargetType } from '@packages/contracts';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../../../domain/formatters/mediaItemUrlBuilder';
import { MinimalAlbumItemSummaryVM } from '../../albums/AlbumSectionMetadata';
import { ReactionsContainer } from '../../reactions/ReactionsContainer';

export const AlbumMediaTile = ({
  item,
  mediaGalleryIds,
  onReactionsRefetch,
}: {
  item: MinimalAlbumItemSummaryVM;
  mediaGalleryIds: string[];
  onReactionsRefetch: () => void;
}) => {
  const mediaItem = item.mediaItem;
  const url = buildMediaItemUrl(mediaItem.id, MediaAssetKind.thumbnail);
  return (
    <>
      <ThumbLink to={`/media/${mediaItem.id}`} state={{ mediaGalleryIds }}>
        {mediaItem.kind.equals(MediaKind.photo) ? (
          <ThumbImage src={url} data-testid={mediaItem.id} alt={mediaItem.title?.trim() ?? ''} />
        ) : (
          <ThumbIcon aria-hidden>{'🎬'}</ThumbIcon>
        )}
      </ThumbLink>
      <ReactionsStrip onClick={(e) => e.stopPropagation()}>
        <ReactionsContainer
          targetId={item.mediaItem.id}
          targetType={ReactionTargetType.mediaItem}
          reactionCounts={item.mediaItem.reactionCounts}
          viewerReactions={item.mediaItem.viewerReactions}
          canReact
          onRefetch={onReactionsRefetch}
        />
      </ReactionsStrip>
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

const ReactionsStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)} 0;
  min-height: 0;
`;
