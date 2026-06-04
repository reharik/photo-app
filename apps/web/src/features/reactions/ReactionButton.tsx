import { ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import type { IconName } from 'lucide-react/dynamic';
import { DynamicIcon } from 'lucide-react/dynamic';
import { JSX } from 'react';
import styled from 'styled-components';

import { theme } from '../../styles/theme';
import { ReactionCountsVM, ViewerReactionVM } from '../../viewModels/';

type Props = {
  emoji: ReactionEmoji;
  targetType: ReactionTargetType;
  targetId?: string;
  reactionCounts: ReactionCountsVM;
  viewerReactions?: ViewerReactionVM[];
  canReact?: boolean;
  onToggle?: () => void;
};

export const ReactionButton = ({
  emoji,
  reactionCounts,
  viewerReactions,
  canReact,
  onToggle,
}: Props): JSX.Element => {
  const hasReaction = viewerReactions?.some((r) => r.emoji.equals(emoji)) ?? false;
  const emojiCount = reactionCounts.byEmoji.find((e) => e.emoji.equals(emoji))?.count ?? 0;
  const ariaLabel = !canReact
    ? `${emojiCount} ${emoji.display}s`
    : !hasReaction
      ? `Add ${emoji.display}`
      : `Remove ${emoji.display}`;
  return (
    <Root>
      <Button
        type="button"
        name={emoji.display}
        $reacted={hasReaction}
        $fillColor={emoji.fillColor}
        disabled={!canReact}
        aria-label={ariaLabel}
        aria-pressed={hasReaction}
        onClick={canReact ? onToggle : undefined}
      >
        <ReactionIcon
          aria-hidden
          name={emoji.iconName as IconName}
          $reacted={hasReaction}
          $fillColor={emoji.fillColor}
        />
      </Button>
      {emojiCount > 0 ? <Count aria-label="Reaction count">{emojiCount}</Count> : null}
    </Root>
  );
};

const Root = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const Button = styled.button<{ $reacted: boolean; $fillColor: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(0.25)};
  border: none;
  background: none;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ $reacted, theme }) => ($reacted ? theme.color.textDanger : theme.color.textMuted)};
  font-size: 14px;
  line-height: 1;
  transition:
    color 0.1s ease,
    background 0.1s ease;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.color.textDanger};
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  &:disabled {
    opacity: ${({ $reacted }) => ($reacted ? 1 : 0.5)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const ReactionIcon = styled(DynamicIcon)<{ $reacted: boolean; $fillColor: string }>`
  width: ${({ theme }) => theme.fontSize._21};
  height: ${({ theme }) => theme.fontSize._21};
  color: ${({ $fillColor }) => theme.color[$fillColor as keyof typeof theme.color]};
  fill: ${({ $reacted }) => ($reacted ? 'currentColor' : 'none')};
`;

const Count = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
