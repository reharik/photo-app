import { Enumeration, enumeration } from '@reharik/smart-enum';

const input = ['album', 'comment', 'reaction'] as const;

export const BatchedPayloadKind = enumeration('BatchedPayloadKind', { input });
export type BatchedPayloadKind = Enumeration<typeof BatchedPayloadKind>;
