// email handler — 3 events

import { AsyncNotificationKind, InAppNotificationType } from '@packages/contracts';
import { ActivityEvent } from './resolveActivity';

export const NOTIFICATION_KIND_BY_EVENT = {
  albumSharedWithUser: AsyncNotificationKind.albumShared,
  mediaItemAddedToAlbum: AsyncNotificationKind.itemAdded,
  mediaItemsSharedWithUser: AsyncNotificationKind.itemShared,
} as const satisfies Record<ActivityEvent['kind'], AsyncNotificationKind>;

// unseen handler — 2 events
export const UNSEEN_KIND_BY_EVENT = {
  albumSharedWithUser: InAppNotificationType.albumShared,
  mediaItemsSharedWithUser: InAppNotificationType.itemShared,
  mediaItemAddedToAlbum: InAppNotificationType.itemAdded,
} as const satisfies Record<ActivityEvent['kind'], InAppNotificationType>;
