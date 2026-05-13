import { EmojiCount } from '../../graphql/generated/types';
import { EmojiCountVM } from './EmojiCountVM';

export const mapEmojiCountToVM = (fragment: EmojiCount): EmojiCountVM => ({
  emoji: fragment.emoji,
  count: fragment.count,
});

export const mapMultipleByEmojisToVMs = (fragments: EmojiCount[]): EmojiCountVM[] =>
  fragments.map(mapEmojiCountToVM);
