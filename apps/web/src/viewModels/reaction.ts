import type { EmojiCountFragment, ReactionCountsFragment } from '../graphql/generated/types';

export type ReactorVM = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isViewer?: boolean;
};

export type EmojiCountVM = EmojiCountFragment & {
  reactors?: ReactorVM[];
};

export type ReactionCountsVM = Omit<ReactionCountsFragment, 'byEmoji'> & {
  byEmoji: EmojiCountVM[];
};
