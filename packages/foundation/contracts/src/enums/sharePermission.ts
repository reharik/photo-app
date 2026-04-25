import { enumeration, type Enumeration } from '@reharik/smart-enum';
const input = ['view', 'download', 'comment', 'contribute'];

export type SharePermission = Enumeration<typeof SharePermission>;
export const SharePermission = enumeration<typeof input>('SharePermission', {
  input,
});
