import {
  NotificationKind,
  NotificationSourceType,
  NotificationTargetType,
} from '@packages/contracts';
import { SystemUserRepository } from '../../repositories';
import { NotificationStrategy, ResolvedNotification } from '../types';

type Deps = {
  systemUserRepository: SystemUserRepository;
};

export const build__NotificationNotificationMediaItemStrategy = ({
  systemUserRepository,
}: Deps): NotificationStrategy<'mediaItemsSharedWithUser'> => ({
  handles: ['mediaItemsSharedWithUser'],
  branches: ['inAppWriter', 'asyncWriter'],
  resolve: async (event): Promise<ResolvedNotification> => {
    const recipients = await systemUserRepository.getUserContacts([event.userId]);
    return {
      recipients,
      actorId: event.actorId,
      targetType: NotificationTargetType.mediaItem,
      targetId: event.mediaItemIds[0],
      sourceType: NotificationSourceType.mediaItem, // degenerate
      sourceId: event.mediaItemIds[0],
      kind: NotificationKind.itemShared,
    };
  },
});
