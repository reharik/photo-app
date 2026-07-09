import { enumeration, type Enumeration } from '@reharik/smart-enum';
const input = ['pending', 'active'];

export type UserStatus = Enumeration<typeof UserStatus>;
export const UserStatus = enumeration<typeof input>('UserStatus', {
  input,
});
