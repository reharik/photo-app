import { MediaAssetKind, MediaKind } from '@packages/contracts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { buildMediaItemUrl } from '../../../domain/formatters/mediaItemUrlBuilder';
import { UnseenDot } from '../../../ui/UnseenDot';
import type { ReactionCountsVM, ViewerReactionVM } from '../../../viewModels/';
import { MediaGridTileReactionPill, ReactionHoverPill } from './MediaGridTileReactionPill';

export type MediaGridTileFit = 'cover' | 'contain';

const defaultBuildTileHref = (itemId: string): string => `/media/${itemId}`;

const placeholderIconForKind = (kind: MediaKind): string =>
  kind.equals(MediaKind.photo) ? '🖼️' : '🎬';

export type MediaGridTileItem = {
  id: string;
  kind: MediaKind;
  title?: string;
  reactionCounts: ReactionCountsVM;
  viewerReactions?: ViewerReactionVM[];
};

export type MediaGridTileProps = {
  item: MediaGridTileItem;
  mediaGalleryIds: string[];
  canReact?: boolean;
  onReactionsRefetch?: () => void;
  onBeforeNavigate?: (itemId: string) => void;
  /** Future burst detection at media ingest; always undefined until then. */
  burstCount?: number;
  tileFit?: MediaGridTileFit;
  /** When true, thumbnail is not a navigation link (e.g. add-to-album / cover pickers). */
  disableTileNavigation?: boolean;
  /** Tile link target; defaults to authed `/media/{id}`. */
  buildTileHref?: (itemId: string) => string;
  /** When false, skip thumbnail fetch and show the kind placeholder (e.g. album with no cover). */
  hasThumbnail?: boolean;
  /** Derived from the viewer-level unseen-activity array (containerType=mediaItem). */
  hasUnseen?: boolean;
};

export const MediaGridTile = ({
  item,
  mediaGalleryIds,
  canReact = false,
  onReactionsRefetch,
  burstCount,
  tileFit = 'cover',
  disableTileNavigation = false,
  buildTileHref = defaultBuildTileHref,
  onBeforeNavigate,
  hasThumbnail = true,
  hasUnseen = false,
}: MediaGridTileProps) => {
  const [thumbLoadFailed, setThumbLoadFailed] = useState(false);
  const showBurstBadge = burstCount != null && burstCount > 1;
  const isContain = tileFit === 'contain';
  const to = buildTileHref(item.id);
  const thumbnailUrl = buildMediaItemUrl(item.id, MediaAssetKind.thumbnail);
  /** Used for data-testid on the thumbnail. */
  const testId = item.id;
  const placeholderIcon = placeholderIconForKind(item.kind);
  const showThumbnailImage = item.kind.equals(MediaKind.photo) && hasThumbnail && !thumbLoadFailed;

  useEffect(() => {
    setThumbLoadFailed(false);
  }, [item.id, hasThumbnail, thumbnailUrl]);

  const thumbContent = (
    <>
      {showThumbnailImage ? (
        <ThumbImage
          src={thumbnailUrl}
          data-testid={testId}
          alt={item.title?.trim() ?? ''}
          $contain={isContain}
          onError={() => setThumbLoadFailed(true)}
        />
      ) : (
        <ThumbIcon aria-hidden $contain={isContain} data-testid={testId}>
          {placeholderIcon}
        </ThumbIcon>
      )}
      {showBurstBadge ? (
        <BurstBadge aria-hidden>
          <BurstIcon>⧉</BurstIcon>
          <BurstCount>{burstCount}</BurstCount>
        </BurstBadge>
      ) : null}
      <MediaGridTileReactionPill
        itemId={item.id}
        reactionCounts={item.reactionCounts}
        viewerReactions={item.viewerReactions}
        canReact={canReact}
        buildTileHref={buildTileHref}
        onReactionsRefetch={onReactionsRefetch}
      />
      {hasUnseen ? <UnseenDot /> : null}
    </>
  );

  const handleActivate = onBeforeNavigate != null ? () => onBeforeNavigate(item.id) : undefined;

  return (
    <TileRoot>
      {disableTileNavigation ? (
        <ThumbShell
          $contain={isContain}
          $clickable={handleActivate != null}
          onClick={handleActivate}
        >
          {thumbContent}
        </ThumbShell>
      ) : (
        <ThumbLink
          to={to}
          state={{ mediaGalleryIds }}
          $contain={isContain}
          onClick={() => (onBeforeNavigate ? onBeforeNavigate(item.id) : undefined)}
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

const ThumbShell = styled.div<{ $contain: boolean; $clickable?: boolean }>`
  ${thumbFrameBaseStyles}
  ${({ $contain }) => ($contain ? thumbFrameContainStyles : '')}
  ${({ $clickable }) => ($clickable ? 'cursor: pointer;' : '')}
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
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-drag: none;
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
