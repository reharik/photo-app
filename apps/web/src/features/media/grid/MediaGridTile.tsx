import { MediaAssetKind, MediaKind } from '@packages/contracts';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { buildMediaItemUrl } from '../../../domain/formatters/mediaItemUrlBuilder';
import type { ReactionCountsVM, ViewerReactionVM } from '../../../viewModels/';
import {
  MediaGridTileReactionPill,
  ReactionHoverPill,
} from './MediaGridTileReactionPill';

export type MediaGridTileFit = 'cover' | 'contain';

const defaultBuildTileHref = (itemId: string): string => `/media/${itemId}`;

export type MediaGridTileProps = {
  mediaGalleryIds: string[];
  kind: MediaKind;
  title?: string;
  reactionCounts: ReactionCountsVM;
  viewerReactions?: ViewerReactionVM[];
  canReact?: boolean;
  onReactionsRefetch?: () => void;
  itemId: string;
  onBeforeNavigate?: (itemId: string) => void;
  /** Future burst detection at media ingest; always undefined until then. */
  burstCount?: number;
  tileFit?: MediaGridTileFit;
  /** When true, thumbnail is not a navigation link (e.g. add-to-album / cover pickers). */
  disableTileNavigation?: boolean;
  /** Tile link target; defaults to authed `/media/{id}`. */
  buildTileHref?: (itemId: string) => string;
};

export const MediaGridTile = ({
  mediaGalleryIds,
  kind,
  title,
  reactionCounts,
  viewerReactions,
  canReact = false,
  onReactionsRefetch,
  itemId,
  burstCount,
  tileFit = 'cover',
  disableTileNavigation = false,
  buildTileHref = defaultBuildTileHref,
  onBeforeNavigate,
}: MediaGridTileProps) => {
  const showBurstBadge = burstCount != null && burstCount > 1;
  const isContain = tileFit === 'contain';
  const to = buildTileHref(itemId);
  const thumbnailUrl = buildMediaItemUrl(itemId, MediaAssetKind.thumbnail);
  /** Used for data-testid on the thumbnail. */
  const testId = itemId;
  const thumbContent = (
    <>
      {kind.equals(MediaKind.photo) ? (
        <ThumbImage
          src={thumbnailUrl}
          data-testid={testId}
          alt={title?.trim() ?? ''}
          $contain={isContain}
        />
      ) : (
        <ThumbIcon aria-hidden $contain={isContain}>
          {'🎬'}
        </ThumbIcon>
      )}
      {showBurstBadge ? (
        <BurstBadge aria-hidden>
          <BurstIcon>⧉</BurstIcon>
          <BurstCount>{burstCount}</BurstCount>
        </BurstBadge>
      ) : null}
      <MediaGridTileReactionPill
        itemId={itemId}
        reactionCounts={reactionCounts}
        viewerReactions={viewerReactions}
        canReact={canReact}
        buildTileHref={buildTileHref}
        onReactionsRefetch={onReactionsRefetch}
      />
    </>
  );

  return (
    <TileRoot>
      {disableTileNavigation ? (
        <ThumbShell $contain={isContain}>{thumbContent}</ThumbShell>
      ) : (
        <ThumbLink
          to={to}
          state={{ mediaGalleryIds }}
          $contain={isContain}
          onClick={() => (onBeforeNavigate ? onBeforeNavigate(itemId) : undefined)}
        >
          {thumbContent}
        </ThumbLink>
      )}
    </TileRoot>
  );
};

const TileRoot = styled.div`
  min-width: 0;
  width: 100%;
`;

const TileChromePill = styled.div`
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(20, 15, 10, 0.55);
  color: ${({ theme }) => theme.color.primaryButtonText};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.weight.medium};
  line-height: 1.2;
  pointer-events: none;
`;

const thumbFrameContainStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.color.bodyElevated};
`;

const thumbFrameBaseStyles = css`
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 3px;
  color: inherit;

  @media (hover: hover) {
    &:hover ${ReactionHoverPill} {
      opacity: 1;
    }
  }
`;

const ThumbShell = styled.div<{ $contain: boolean }>`
  ${thumbFrameBaseStyles}
  ${({ $contain }) => ($contain ? thumbFrameContainStyles : '')}
`;

const ThumbLink = styled(Link)<{ $contain: boolean }>`
  ${thumbFrameBaseStyles}
  text-decoration: none;
  ${({ $contain }) => ($contain ? thumbFrameContainStyles : '')}
`;

const thumbImageCoverStyles = css`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const thumbImageContainStyles = css`
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
`;

const ThumbImage = styled.img<{ $contain: boolean }>`
  ${({ $contain }) => ($contain ? thumbImageContainStyles : thumbImageCoverStyles)}
`;

const ThumbIcon = styled.div<{ $contain: boolean }>`
  opacity: 0.35;
  font-size: ${({ $contain }) => ($contain ? '32px' : '40px')};
  ${({ $contain, theme }) =>
    $contain
      ? ''
      : `
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${theme.color.bodyElevated};
  `}
`;

const BurstBadge = styled(TileChromePill)`
  right: ${({ theme }) => theme.spacing(0.75)};
  bottom: ${({ theme }) => theme.spacing(0.75)};
`;

const BurstIcon = styled.span`
  font-size: 10px;
  line-height: 1;
`;

const BurstCount = styled.span`
  font-variant-numeric: tabular-nums;
`;
