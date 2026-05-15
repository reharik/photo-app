import { ReactionEmoji } from '@packages/contracts';
import { JSX } from 'react';
import { ReactionCountsVM } from '../../viewModels/';
import { ReactionCount } from './ReactionCount';

type Props = {
  reactionCounts: ReactionCountsVM;
};

export const PublicReactionsForCommentContainer = ({ reactionCounts }: Props): JSX.Element => {
  return <ReactionCount emoji={ReactionEmoji.heart} reactionCounts={reactionCounts} />;
};
