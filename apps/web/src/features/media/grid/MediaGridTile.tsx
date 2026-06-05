import { MediaKind, ReactionEmoji } from '@packages/contracts';
import { Heart, MessageCircleMore } from 'lucide-react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import type { ReactionCountsVM } from '../../../viewModels/';

export type MediaGridTileFit = 'cover' | 'contain';

export type MediaGridTileProps = {
  to: string;
  thumbnailUrl: string;
  mediaGalleryIds: string[];
  kind: MediaKind;
  title?: string;
  reactionCounts: ReactionCountsVM;
  /** Used for data-testid on the thumbnail. */
  testId: string;
  onBeforeNavigate?: () => void;
  /** Future burst detection at media ingest; always undefined until then. */
  burstCount?: number;
  tileFit?: MediaGridTileFit;
};

const getReactionCount = (reactionCounts: ReactionCountsVM, emoji: ReactionEmoji): number =>
  reactionCounts.byEmoji.find((e) => e.emoji.equals(emoji))?.count ?? 0;

export const MediaGridTile = ({
  to,
  thumbnailUrl,
  mediaGalleryIds,
  kind,
  title,
  reactionCounts,
  testId,
  burstCount,
  tileFit = 'cover',
  onBeforeNavigate,
}: MediaGridTileProps) => {
  const showBurstBadge = burstCount != null && burstCount > 1;
  const heartCount = getReactionCount(reactionCounts, ReactionEmoji.heart);
  const commentCount = getReactionCount(reactionCounts, ReactionEmoji.comment);
  const showReactionPill = heartCount > 0 || commentCount > 0;
  const isContain = tileFit === 'contain';

  return (
    <TileRoot>
      <ThumbLink
        to={to}
        state={{ mediaGalleryIds }}
        $contain={isContain}
        onClick={() => {
          onBeforeNavigate?.();
        }}
      >
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
        {showReactionPill ? (
          <ReactionHoverPill aria-hidden>
            {heartCount > 0 ? (
              <ReactionStat>
                <HeartIcon size={11} strokeWidth={2} aria-hidden />
                <ReactionCount>{heartCount}</ReactionCount>
              </ReactionStat>
            ) : null}
            {commentCount > 0 ? (
              <ReactionStat>
                <CommentIcon size={11} strokeWidth={2} aria-hidden />
                <ReactionCount>{commentCount}</ReactionCount>
              </ReactionStat>
            ) : null}
          </ReactionHoverPill>
        ) : null}
      </ThumbLink>
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

const ReactionHoverPill = styled(TileChromePill)`
  left: ${({ theme }) => theme.spacing(0.75)};
  bottom: ${({ theme }) => theme.spacing(0.75)};
  gap: 6px;
  opacity: 0;
  transition: opacity 150ms ease;
`;

const thumbLinkContainStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.color.bodyElevated};
`;

const ThumbLink = styled(Link)<{ $contain: boolean }>`
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 3px;
  color: inherit;
  text-decoration: none;

  ${({ $contain }) => ($contain ? thumbLinkContainStyles : '')}

  @media (hover: hover) {
    &:hover ${ReactionHoverPill} {
      opacity: 1;
    }
  }
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

const ReactionStat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
`;

const heartIconStyles = `
  flex-shrink: 0;
  color: inherit;
  fill: none;
`;

const HeartIcon = styled(Heart)`
  ${heartIconStyles}
`;

const CommentIcon = styled(MessageCircleMore)`
  ${heartIconStyles}
`;

const ReactionCount = styled.span`
  font-variant-numeric: tabular-nums;
`;

const BurstIcon = styled.span`
  font-size: 10px;
  line-height: 1;
`;

const BurstCount = styled.span`
  font-variant-numeric: tabular-nums;
`;
