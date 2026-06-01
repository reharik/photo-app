import { ReactionEmoji } from '@packages/contracts';
import { JSX } from 'react';
import { ReactionCountsVM } from '../../viewModels/';
import { ReactionCount } from './ReactionCount';

type Props = {
  reactionCounts: ReactionCountsVM;
};

export const PublicReactionsContainer = ({ reactionCounts }: Props): JSX.Element => {
  const displayEmojis = ReactionEmoji.items().filter((emoji) =>
    reactionCounts.byEmoji.some((r) => r.emoji.equals(emoji) && r.count > 0),
  );

  return (
    <>
      {displayEmojis.map((emoji) => (
        <ReactionCount emoji={emoji} reactionCounts={reactionCounts} />
      ))}
    </>
  );
};
