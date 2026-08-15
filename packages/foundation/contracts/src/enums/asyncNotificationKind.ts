import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { InAppNotificationType } from './graphqlSmartEnums';
import { NotificationKind } from './notificationKind';

// "Does this notification wait for company" — a delivery-batching axis, distinct
// from `channel` (email/sms) and from SweepCadence (worker scheduling intervals).
// Do not widen with scheduling members: that would weaken the exhaustiveness
// checks over notification kinds by covering a space no notification occupies.
const cadenceInput = ['immediate', 'batched'] as const;
export type Batching = Enumeration<typeof Batching>;
export const Batching = enumeration<typeof cadenceInput>('Batching', {
  input: cadenceInput,
});

const input = {
  albumShared: { cadence: Batching.immediate, emailTemplate: 'albumShareInvite' },
  guestAlbumShared: { cadence: Batching.immediate, emailTemplate: 'albumGuestInvite' },
  itemAdded: { cadence: Batching.batched, emailTemplate: 'albumActivity' },
  commentPosted: { cadence: Batching.batched, emailTemplate: 'albumActivity' },
  replyPosted: { cadence: Batching.batched, emailTemplate: 'albumActivity' },
  reactionAdded: { cadence: Batching.batched, emailTemplate: 'albumActivity' },
};

export type AsyncNotificationKind = Enumeration<typeof AsyncNotificationKind>;
export const AsyncNotificationKind = enumeration<typeof input>('AsyncNotificationKind', {
  input: input,
});

type AssertExtends<Sub extends Sup, Sup> = Sub;

// each line errors iff the branch enum has a value not in NotificationKind
export type _AsyncOk = AssertExtends<AsyncNotificationKind['value'], NotificationKind['value']>;
export type _InAppOk = AssertExtends<InAppNotificationType['value'], NotificationKind['value']>;
