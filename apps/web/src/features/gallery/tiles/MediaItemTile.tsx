import { MediaAssetKind, MediaKind, ReactionTargetType } from '@packages/contracts';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../../../domain/formatters/mediaItemUrlBuilder';
import { MediaItemSummaryVM } from '../../../viewModels/';
import { ReactionsContainer } from '../../reactions/ReactionsContainer';

export const MediaItemTile = ({
  item,
  mediaGalleryIds,
  onReactionsRefetch,
}: {
  item: MediaItemSummaryVM;
  mediaGalleryIds: string[];
  onReactionsRefetch?: () => void;
}) => {
  const url = buildMediaItemUrl(item.id, MediaAssetKind.thumbnail);
  return (
    <TileColumn>
      <ThumbLink to={`/media/${item.id}`} state={{ mediaGalleryIds }}>
        {item.kind.equals(MediaKind.photo) ? (
          <ThumbImage src={url} data-testid={item.id} alt={item.title?.trim() ?? ''} />
        ) : (
          <ThumbIcon aria-hidden>{'🎬'}</ThumbIcon>
        )}
      </ThumbLink>
      <ReactionsStrip onClick={(e) => e.stopPropagation()}>
        <ReactionsContainer
          targetId={item.id}
          targetType={ReactionTargetType.mediaItem}
          reactionCounts={item.reactionCounts}
          viewerReactions={item.viewerReactions}
          canReact
          onRefetch={onReactionsRefetch}
        />
      </ReactionsStrip>
      <CaptionLink to={`/media/${item.id}`}>
        <MediaInfo>
          <MediaTitle>{item.title?.trim() ?? ''}</MediaTitle>
          <MediaMeta>
            {item.createdAt ? item.createdAt.toLocaleString(DateTime.DATE_MED) : ''}
          </MediaMeta>
        </MediaInfo>
      </CaptionLink>
    </TileColumn>
  );
};

const TileColumn = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
`;

const ReactionsStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)} 0;
  min-height: 0;
`;

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
