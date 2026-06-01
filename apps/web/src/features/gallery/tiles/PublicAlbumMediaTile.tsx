import { MediaAssetKind, MediaKind, ReactionTargetType } from '@packages/contracts';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../../../domain/formatters/mediaItemUrlBuilder';
import { MinimalAlbumItemSummaryVM } from '../../albums/AlbumSectionMetadata';

import { ReactionsContainer } from '../../reactions/ReactionsContainer';
export const PublicAlbumMediaTile = ({
  item,
  mediaGalleryIds,
}: {
  item: MinimalAlbumItemSummaryVM;
  mediaGalleryIds: string[];
}) => {
  const mediaItem = item.mediaItem;
  const { token } = useParams<{ token: string }>();
  const url = buildMediaItemUrl(mediaItem.id, MediaAssetKind.thumbnail);

  return (
    <>
      <ThumbLink to={`/shared/${token}/media/${mediaItem.id}`} state={{ mediaGalleryIds }}>
        {mediaItem.kind === MediaKind.photo ? (
          <ThumbImage src={url} data-testid={mediaItem.id} alt={mediaItem.title?.trim() ?? ''} />
        ) : (
          <ThumbIcon aria-hidden>{'🎬'}</ThumbIcon>
        )}
      </ThumbLink>
      <ReactionsStrip>
        <ReactionsContainer
          targetId={item.mediaItem.id}
          targetType={ReactionTargetType.mediaItem}
          reactionCounts={item.mediaItem.reactionCounts}
          viewerReactions={item.mediaItem.viewerReactions}
          canReact={false}
        />
      </ReactionsStrip>
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

const ReactionsStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)} 0;
  min-height: 0;
`;
