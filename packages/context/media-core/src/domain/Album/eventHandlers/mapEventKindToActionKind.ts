// email handler — 3 events

import { InAppNotificationType, PendingNotificationKind } from '@packages/contracts';
import { ActivityEvent } from './resolveActivity';

export const NOTIFICATION_KIND_BY_EVENT = {
  albumSharedWithUser: PendingNotificationKind.albumShared,
  mediaItemAddedToAlbum: PendingNotificationKind.itemAdded,
  mediaItemsSharedWithUser: PendingNotificationKind.itemShared,
} as const satisfies Record<ActivityEvent['kind'], PendingNotificationKind>;

// unseen handler — 2 events
export const UNSEEN_KIND_BY_EVENT = {
  albumSharedWithUser: InAppNotificationType.albumShared,
  mediaItemsSharedWithUser: InAppNotificationType.itemShared,
  mediaItemAddedToAlbum: InAppNotificationType.itemAdded,
} as const satisfies Record<ActivityEvent['kind'], InAppNotificationType>;
