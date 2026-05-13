import { enumeration, type Enumeration } from '@reharik/smart-enum';
const icons = { heart: { filledIn: '❤️', outline: '♡' } };
const input = {
  heart: {
    ...icons.heart,
    hasReaction: (hasReaction: boolean) => {
      return hasReaction
        ? { display: 'Remove reaction', icon: icons.heart.filledIn }
        : { display: 'Add reaction', icon: icons.heart.outline };
    },
  },
};
export type ReactionEmoji = Enumeration<typeof ReactionEmoji>;
export const ReactionEmoji = enumeration<typeof input>('ReactionEmoji', {
  input: input,
});
