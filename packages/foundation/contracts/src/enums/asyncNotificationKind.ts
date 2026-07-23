import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { InAppNotificationType } from './graphqlSmartEnums';
import { NotificationKind } from './notificationKind';

const cadenceInput = ['immediate', 'batched'];
export type NotificationCadence = Enumeration<typeof NotificationCadence>;
export const NotificationCadence = enumeration<typeof cadenceInput>('NotificationCadence', {
  input: cadenceInput,
});

const input = {
  albumShared: { cadence: NotificationCadence.immediate, emailTemplate: 'albumShareInvite' },
  guestAlbumShared: { cadence: NotificationCadence.immediate, emailTemplate: 'albumGuestInvite' },
  itemShared: { cadence: NotificationCadence.immediate, emailTemplate: 'itemShareInvite' },
  itemAdded: { cadence: NotificationCadence.batched, emailTemplate: 'albumActivity' },
  commentPosted: { cadence: NotificationCadence.batched, emailTemplate: 'albumActivity' },
  replyPosted: { cadence: NotificationCadence.batched, emailTemplate: 'albumActivity' },
  reactionAdded: { cadence: NotificationCadence.batched, emailTemplate: 'albumActivity' },
};

export type AsyncNotificationKind = Enumeration<typeof AsyncNotificationKind>;
export const AsyncNotificationKind = enumeration<typeof input>('AsyncNotificationKind', {
  input: input,
});

type AssertExtends<Sub extends Sup, Sup> = Sub;

// each line errors iff the branch enum has a value not in NotificationKind
export type _AsyncOk = AssertExtends<AsyncNotificationKind['value'], NotificationKind['value']>;
export type _InAppOk = AssertExtends<InAppNotificationType['value'], NotificationKind['value']>;
