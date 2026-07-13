import { EntityType, ReactionEmoji } from '@packages/contracts';
import type { IconName } from 'lucide-react/dynamic';
import { DynamicIcon } from 'lucide-react/dynamic';
import { type JSX } from 'react';
import styled from 'styled-components';
import type { ReactionCountsFragment } from '../../../graphql/generated/types';
import { useAppMutationState } from '../../../hooks/useAppMutation';
import { useReactionHandlers } from '../../../hooks/useReactionHandlers';
import type { ViewerReactionVM } from '../../../viewModels/';
import { buildReactorLine } from './formatReactorLine';
import { ReactorLineDisplay } from './ReactorLineDisplay';

export type MediaItemDetailRailReactionsProps = {
  mediaItemId: string;
  reactionCounts: ReactionCountsFragment;
  viewerReactions?: ViewerReactionVM[];
  onRefetch?: () => Promise<void>;
};

export const MediaItemDetailRailReactions = ({
  mediaItemId,
  reactionCounts,
  viewerReactions,
  onRefetch,
}: MediaItemDetailRailReactionsProps): JSX.Element => {
  const toggleMutation = useAppMutationState();
  const { handleToggle } = useReactionHandlers(
    mediaItemId,
    EntityType.mediaItem,
    toggleMutation,
    viewerReactions,
    onRefetch != null ? () => void onRefetch() : undefined,
  );

  const heartEntry = reactionCounts.byEmoji.find((entry) =>
    entry.emoji.equals(ReactionEmoji.heart),
  );
  const reactors = heartEntry?.reactors ?? [];
  const reactorLine = buildReactorLine(reactors);
  const hasReaction =
    viewerReactions?.some((reaction) => reaction.emoji.equals(ReactionEmoji.heart)) ?? false;
  const heartEmoji = ReactionEmoji.heart;

  return (
    <Root>
      <HeartButton
        type="button"
        aria-label={hasReaction ? 'Remove heart reaction' : 'React with a heart'}
        aria-pressed={hasReaction}
        disabled={toggleMutation.isLoading}
        $reacted={hasReaction}
        onClick={() => void handleToggle(heartEmoji)}
      >
        <HeartIcon
          aria-hidden
          name={heartEmoji.iconName as IconName}
          $reacted={hasReaction}
          $fillColor={heartEmoji.fillColor}
        />
      </HeartButton>
      {reactorLine != null ? (
        <ReactorLineDisplay reactorLine={reactorLine} />
      ) : (
        <PromptText>React with a heart</PromptText>
      )}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(1)} 0;
`;

const HeartButton = styled.button<{ $reacted: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(0.25)};
  border: none;
  background: none;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ $reacted, theme }) => ($reacted ? theme.color.textDanger : theme.color.textMuted)};
  flex-shrink: 0;
  transition:
    color 0.1s ease,
    background 0.1s ease;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.color.textDanger};
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const HeartIcon = styled(DynamicIcon)<{ $reacted: boolean; $fillColor: string }>`
  width: ${({ theme }) => theme.fontSize._21};
  height: ${({ theme }) => theme.fontSize._21};
  color: ${({ $fillColor, theme }) => theme.color[$fillColor as keyof typeof theme.color]};
  fill: ${({ $reacted }) => ($reacted ? 'currentColor' : 'none')};
`;

const PromptText = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.textMuted};
`;
