// email handler — 3 events

import { PendingNotificationKind, UnseenActivityType } from '@packages/contracts';
import { ActivityEvent } from './resolveActivity';

export const NOTIFICATION_KIND_BY_EVENT = {
  albumSharedWithUser: PendingNotificationKind.albumShared,
  mediaItemAddedToAlbum: PendingNotificationKind.itemAdded,
  mediaItemsSharedWithUser: PendingNotificationKind.itemShared,
  albumSharedWithNonUser: PendingNotificationKind.guestAlbumShared,
} as const satisfies Record<ActivityEvent['kind'], PendingNotificationKind>;

// unseen handler — 2 events
export const UNSEEN_KIND_BY_EVENT = {
  albumSharedWithUser: UnseenActivityType.albumShared,
  mediaItemsSharedWithUser: UnseenActivityType.itemShared,
  mediaItemAddedToAlbum: UnseenActivityType.itemAdded,
} as const satisfies Record<
  Exclude<ActivityEvent['kind'], 'albumSharedWithNonUser'>,
  UnseenActivityType
>;
