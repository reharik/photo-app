import { enumeration, Enumeration } from '@reharik/smart-enum';

const input = ['sent', 'delivered', 'bounced', 'rejected', 'complained', 'delivered'] as const;
export type EmailStatus = Enumeration<typeof EmailStatus>;
export const EmailStatus = enumeration<typeof input>('EmailStatus', {
  input,
});
