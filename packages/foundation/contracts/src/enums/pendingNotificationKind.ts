import { enumeration, type Enumeration } from '@reharik/smart-enum';

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
export type PendingNotificationKind = Enumeration<typeof PendingNotificationKind>;
export const PendingNotificationKind = enumeration<typeof input>('PendingNotificationKind', {
  input: input,
});
