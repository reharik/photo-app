import { ReactionEmoji } from '@packages/contracts';
import type { IconName } from 'lucide-react/dynamic';
import { DynamicIcon } from 'lucide-react/dynamic';
import type { JSX } from 'react';
import styled from 'styled-components';
import type { ReactionCountsVM } from '../../../viewModels/';

export type PublicMediaItemDetailRailReactionsProps = {
  reactionCounts: ReactionCountsVM;
};

const formatPublicReactionCount = (count: number): string => {
  if (count === 1) {
    return '1 person reacted';
  }
  return `${count} people reacted`;
};

export const PublicMediaItemDetailRailReactions = ({
  reactionCounts,
}: PublicMediaItemDetailRailReactionsProps): JSX.Element | null => {
  const heartCount =
    reactionCounts.byEmoji.find((entry) => entry.emoji.equals(ReactionEmoji.heart))?.count ?? 0;

  if (heartCount === 0) {
    return null;
  }

  const heartEmoji = ReactionEmoji.heart;

  return (
    <Root>
      <HeartIcon
        aria-hidden
        name={heartEmoji.iconName as IconName}
        $fillColor={heartEmoji.fillColor}
      />
      <CountText>{formatPublicReactionCount(heartCount)}</CountText>
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(1)} 0;
`;

const HeartIcon = styled(DynamicIcon)<{ $fillColor: string }>`
  width: ${({ theme }) => theme.fontSize._21};
  height: ${({ theme }) => theme.fontSize._21};
  color: ${({ $fillColor, theme }) => theme.color[$fillColor as keyof typeof theme.color]};
  fill: currentColor;
  flex-shrink: 0;
`;

const CountText = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.textSecondary};
`;
