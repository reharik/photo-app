import { ReactionEmoji, EntityType } from '@packages/contracts';
import { Heart, MessageCircleMore } from 'lucide-react';
import type { MouseEvent } from 'react';
import styled from 'styled-components';
import { useAppMutationState } from '../../../hooks/useAppMutation';
import { useReactionHandlers } from '../../../hooks/useReactionHandlers';
import type { ReactionCountsVM, ViewerReactionVM } from '../../../viewModels/';

export type MediaGridTileReactionPillProps = {
  itemId: string;
  reactionCounts: ReactionCountsVM;
  viewerReactions?: ViewerReactionVM[];
  canReact: boolean;
  buildTileHref: (itemId: string) => string;
  onReactionsRefetch?: () => void;
};

const getReactionCount = (reactionCounts: ReactionCountsVM, emoji: ReactionEmoji): number =>
  reactionCounts.byEmoji.find((e) => e.emoji.equals(emoji))?.count ?? 0;

const stopTileNavigation = (event: MouseEvent): void => {
  event.preventDefault();
  event.stopPropagation();
};

export const MediaGridTileReactionPill = ({
  itemId,
  reactionCounts,
  viewerReactions,
  canReact,
  buildTileHref,
  onReactionsRefetch,
}: MediaGridTileReactionPillProps) => {
  const heartCount = getReactionCount(reactionCounts, ReactionEmoji.heart);
  const commentCount = getReactionCount(reactionCounts, ReactionEmoji.comment);
  const showPill = canReact || heartCount > 0 || commentCount > 0;

  if (!showPill) {
    return null;
  }

  if (canReact) {
    return (
      <InteractiveReactionPill
        itemId={itemId}
        heartCount={heartCount}
        commentCount={commentCount}
        viewerReactions={viewerReactions}
        buildTileHref={buildTileHref}
        onReactionsRefetch={onReactionsRefetch}
      />
    );
  }

  return (
    <ReactionHoverPill $interactive={false} aria-hidden>
      {heartCount > 0 ? (
        <DisplayStat>
          <DisplayHeartIcon size={11} strokeWidth={2} aria-hidden />
          <ReactionCount>{heartCount}</ReactionCount>
        </DisplayStat>
      ) : null}
      {commentCount > 0 ? (
        <DisplayStat>
          <DisplayCommentIcon size={11} strokeWidth={2} aria-hidden />
          <ReactionCount>{commentCount}</ReactionCount>
        </DisplayStat>
      ) : null}
    </ReactionHoverPill>
  );
};

type InteractiveReactionPillProps = {
  itemId: string;
  heartCount: number;
  commentCount: number;
  viewerReactions?: ViewerReactionVM[];
  buildTileHref: (itemId: string) => string;
  onReactionsRefetch?: () => void;
};

const InteractiveReactionPill = ({
  itemId,
  heartCount,
  commentCount,
  viewerReactions,
  buildTileHref,
  onReactionsRefetch,
}: InteractiveReactionPillProps) => {
  const toggleMutation = useAppMutationState();
  const { handleToggle } = useReactionHandlers(
    itemId,
    EntityType.mediaItem,
    toggleMutation,
    viewerReactions ?? [],
    onReactionsRefetch,
    buildTileHref,
  );
  const hasHeartReaction =
    viewerReactions?.some((reaction) => reaction.emoji.equals(ReactionEmoji.heart)) ?? false;
  const isBusy = toggleMutation.isLoading;
  const heartAriaLabel = !hasHeartReaction ? 'Add heart' : 'Remove heart';
  const commentAriaLabel = commentCount > 0 ? `${commentCount} comments` : 'View comments';

  return (
    <ReactionHoverPill $interactive>
      <IconHitTarget
        type="button"
        aria-label={heartAriaLabel}
        aria-pressed={hasHeartReaction}
        disabled={isBusy}
        onClick={(event) => {
          stopTileNavigation(event);
          if (!isBusy) {
            void handleToggle(ReactionEmoji.heart);
          }
        }}
      >
        <HeartIcon $reacted={hasHeartReaction} size={11} strokeWidth={2} aria-hidden />
        {heartCount > 0 ? <ReactionCount>{heartCount}</ReactionCount> : null}
      </IconHitTarget>
      <IconHitTarget
        type="button"
        aria-label={commentAriaLabel}
        disabled={isBusy}
        onClick={(event) => {
          stopTileNavigation(event);
          if (!isBusy) {
            void handleToggle(ReactionEmoji.comment);
          }
        }}
      >
        <CommentIcon size={11} strokeWidth={2} aria-hidden />
        {commentCount > 0 ? <ReactionCount>{commentCount}</ReactionCount> : null}
      </IconHitTarget>
    </ReactionHoverPill>
  );
};

/** Exported for tile hover selector in {@link MediaGridTile}. */
export const ReactionHoverPill = styled.div<{ $interactive: boolean }>`
  position: absolute;
  left: ${({ theme }) => theme.spacing(0.75)};
  bottom: ${({ theme }) => theme.spacing(0.75)};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(20, 15, 10, 0.55);
  color: ${({ theme }) => theme.color.primaryButtonText};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.weight.medium};
  line-height: 1.2;
  pointer-events: ${({ $interactive }) => ($interactive ? 'auto' : 'none')};
  opacity: 0;
  transition: opacity 150ms ease;
`;

const IconHitTarget = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px;
  margin: -2px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  line-height: 1;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: default;
  }
`;

const DisplayStat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
`;

const iconBaseStyles = `
  flex-shrink: 0;
  fill: none;
`;

const HeartIcon = styled(Heart)<{ $reacted: boolean }>`
  ${iconBaseStyles}
  color: ${({ theme, $reacted }) => ($reacted ? theme.color.primaryButtonBg : 'inherit')};
  fill: ${({ theme, $reacted }) => ($reacted ? theme.color.primaryButtonBg : 'none')};
`;

const CommentIcon = styled(MessageCircleMore)`
  ${iconBaseStyles}
  color: inherit;
`;

const DisplayHeartIcon = styled(Heart)`
  ${iconBaseStyles}
  color: inherit;
`;

const DisplayCommentIcon = styled(MessageCircleMore)`
  ${iconBaseStyles}
  color: inherit;
`;

const ReactionCount = styled.span`
  font-size: 11px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;
