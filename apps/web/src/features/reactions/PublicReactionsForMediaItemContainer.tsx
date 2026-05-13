import { ReactionEmoji } from '@packages/contracts';
import { JSX } from 'react';
import { ReactionCountsVM } from '../../viewModels/reactions/ReactionCountsVM';
import { ReactionCount } from './ReactionCount';

type Props = {
  reactionCounts: ReactionCountsVM;
};

export const PublicReactionsForMediaItemContainer = ({ reactionCounts }: Props): JSX.Element => {
  return <ReactionCount emoji={ReactionEmoji.heart} reactionCounts={reactionCounts} />; // Eventually iterate over ReactionEmoji.items
};
