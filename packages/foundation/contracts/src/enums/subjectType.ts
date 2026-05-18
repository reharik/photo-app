import { enumeration, Enumeration } from '@reharik/smart-enum';

const input = ['album', 'albumItem', 'mediaItem'] as const;
export type SubjectType = Enumeration<typeof SubjectType>;
export const SubjectType = enumeration<typeof input>('SubjectType', {
  input,
});
