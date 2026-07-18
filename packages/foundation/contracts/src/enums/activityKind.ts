import { Enumeration, enumeration } from '@reharik/smart-enum';

const input = ['album', 'comment', 'reaction'] as const;

export const ActivityKind = enumeration('ActivityKind', { input });
export type ActivityKind = Enumeration<typeof ActivityKind>;
