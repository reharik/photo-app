import { enumeration, type Enumeration } from '@reharik/smart-enum';
const input = {
  heart: {
    // this much match the icon name in the icon library (lucide-react) and those icons
    // use kebab-case.  I could transform the key to kebab-case, but for now
    // I'll just name it explicitly.
    iconName: 'heart',
  },
};
export type ReactionEmoji = Enumeration<typeof ReactionEmoji>;
export const ReactionEmoji = enumeration<typeof input>('ReactionEmoji', {
  input: input,
});
