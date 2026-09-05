import { enumeration, Enumeration } from '@reharik/smart-enum';

const input = {
  send: {
    rank: 0,
    display: 'Sent',
    state: 'pending',
  },
  delivery: {
    rank: 1,
    display: 'Delivered',
    state: 'delivered',
  },
  bounceTransient: {
    rank: 1,
    display: 'Bounced (transient)',
    state: 'delivered',
  },
  complaint: {
    rank: 2,
    display: 'Complained',
    state: 'delivered',
  },
  reject: {
    rank: 3,
    display: 'Rejected',
    state: 'failed',
  },
  bouncePermanent: {
    rank: 3,
    display: 'Bounced',
    state: 'failed',
  },
} as const;
export type EmailStatus = Enumeration<typeof EmailStatus>;
export const EmailStatus = enumeration<typeof input>('EmailStatus', {
  input,
});
