import { EmojiCountVM } from './EmojiCountVM';

export type ReactionCountsVM = {
  total: number;
  byEmoji: EmojiCountVM[];
};
