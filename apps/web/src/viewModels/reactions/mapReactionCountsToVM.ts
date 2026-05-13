import { type ReactionCounts } from '../../graphql/generated/types';
import { mapMultipleByEmojisToVMs } from './mapEmojiCountToVM';
import { ReactionCountsVM } from './ReactionCountsVM';

export const mapReactionCountsToVM = (fragment: ReactionCounts): ReactionCountsVM => ({
  total: fragment.total,
  byEmoji: mapMultipleByEmojisToVMs(fragment.byEmoji),
});

export const mapMultipleReactionCountsToVMs = (fragments: ReactionCounts[]): ReactionCountsVM[] =>
  fragments.map(mapReactionCountsToVM);
