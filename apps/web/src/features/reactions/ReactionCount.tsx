import { ReactionEmoji } from '@packages/contracts';
import { JSX } from 'react';
import styled from 'styled-components';
import { ReactionCountsVM } from '../../viewModels/reactions/ReactionCountsVM';

type Props = {
  emoji: ReactionEmoji;
  reactionCounts: ReactionCountsVM;
};

export const ReactionCount = ({ emoji, reactionCounts }: Props): JSX.Element => {
  const count = reactionCounts.byEmoji.find((e) => e.emoji === emoji)?.count ?? 0;
  return (
    <Root>
      <Icon aria-hidden>{emoji.hasReaction(count > 0).icon}</Icon>
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

const Icon = styled.span`
  font-size: 13px;
  line-height: 1;
`;

const Count = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
