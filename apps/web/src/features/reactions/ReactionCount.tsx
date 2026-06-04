import { ReactionEmoji } from '@packages/contracts';
import { DynamicIcon, IconName } from 'lucide-react/dynamic';
import { JSX } from 'react';
import styled from 'styled-components';
import { ReactionCountsVM } from '../../viewModels/';

type Props = {
  emoji: ReactionEmoji;
  reactionCounts: ReactionCountsVM;
};

export const ReactionCount = ({ emoji, reactionCounts }: Props): JSX.Element => {
  const count = reactionCounts.byEmoji.find((e) => e.emoji.equals(emoji))?.count ?? 0;
  return (
    <Root>
      <ReactionIcon aria-hidden name={emoji.iconName as IconName} $reacted={count > 0} />
      {count > 0 ? <Count>{count}</Count> : null}
    </Root>
  );
};

const Root = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const ReactionIcon = styled(DynamicIcon)<{ $reacted: boolean }>`
  width: ${({ theme }) => theme.fontSize._21};
  height: ${({ theme }) => theme.fontSize._21};
  color: ${({ theme }) => theme.color.red_darker};
  fill: ${({ $reacted }) => ($reacted ? 'currentColor' : 'none')};
`;

const Count = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
