import { enumeration, Enumeration } from '@reharik/smart-enum';

const input = ['albumShared', 'guestAlbumShared', 'activityDigest'] as const;
export type EmailKind = Enumeration<typeof EmailKind>;
export const EmailKind = enumeration<typeof input>('EmailKind', {
  input,
});
