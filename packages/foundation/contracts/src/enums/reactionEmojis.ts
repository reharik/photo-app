import { enumeration, type Enumeration } from '@reharik/smart-enum';
const icons = {
  heart: {
    reacted: '♥', // U+2665 — filled, takes CSS color
    notReacted: '♡', // U+2661 — outline, takes CSS color
  },
};
const input = {
  heart: {
    ...icons.heart,
    hasReaction: (hasReaction: boolean) => {
      return hasReaction ? icons.heart.reacted : icons.heart.notReacted;
    },
  },
};
export type ReactionEmoji = Enumeration<typeof ReactionEmoji>;
export const ReactionEmoji = enumeration<typeof input>('ReactionEmoji', {
  input: input,
  serializeAs: 'value',
});
