import { ActivitySurface, NotificationKind } from '@packages/contracts';
import { EnumSubset } from '@reharik/smart-enum';
import {
  MediaItemOwner,
  SystemInAppNotificationRepository,
  SystemMediaItemRepository,
} from '../../repositories';
import { ResolvedNotification } from '../types';

export interface InAppWriter extends NotificationWriter {
  readonly __brand?: 'inApp';
}

export interface NotificationWriter {
  (n: ResolvedNotification): Promise<void>;
}
type Deps = {
  systemInAppNotificationRepository: SystemInAppNotificationRepository;
  systemMediaItemRepository: SystemMediaItemRepository;
};

// Dumb mapper: canonical -> in_app_notification row.
// - recipient -> viewerId (the recipient/viewer rename happens HERE, at the boundary)
// - stores actorId (needs a new actor_id column — see migration)
// - no channel / attempts (those are async/queue concepts)
export const build__InAppWriter =
  ({ systemInAppNotificationRepository, systemMediaItemRepository }: Deps): InAppWriter =>
  async (n) => {
    type possibleInAppNotificationKinds = EnumSubset<
      NotificationKind,
      'albumShared' | 'itemAdded' | 'itemShared' | 'commentPosted' | 'replyPosted'
    >;
    const kind = n.kind as possibleInAppNotificationKinds;
    let item: MediaItemOwner;
    if (kind.equals(NotificationKind.replyPosted)) {
      item = await systemMediaItemRepository.getMediaItemById(n.containerId);
    }
    await Promise.all(
      n.recipients.map((r) => {
        const surface = kind.match<ActivitySurface>({
          albumShared: () => ActivitySurface.sharedAlbums,
          itemAdded: () => ActivitySurface.sharedAlbums,
          itemShared: () => ActivitySurface.sharedItems,
          commentPosted: () => ActivitySurface.recent,
          replyPosted: () =>
            // item is guaranteed assigned here, but only by convention
            item.ownerId === r.id ? ActivitySurface.recent : ActivitySurface.sharedItems,
        });

        return systemInAppNotificationRepository.upsertActivityRow({
          id: crypto.randomUUID(),
          viewerId: r.id,
          actorId: n.actorId, // NEW — for "who" display + dot placement
          containerType: n.containerType,
          containerId: n.containerId,
          subjectType: n.subjectType,
          subjectId: n.subjectId,
          kind: n.kind,
          surface,
        });
      }),
    );
  };
