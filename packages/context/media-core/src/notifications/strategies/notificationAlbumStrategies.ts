import {
  EntityType,
  NotificationKind,
  NotificationSourceType,
  NotificationTargetType,
} from '@packages/contracts';
import { SystemAuthorizationRepository, SystemUserRepository } from '../../repositories';
import { NotificationStrategy, ResolvedNotification } from '../types';

type Deps = {
  systemAuthorizationRepository: SystemAuthorizationRepository;
  systemUserRepository: SystemUserRepository;
};

// Was resolveActivity + inAppNotificationHandler + asyncNotificationHandler.
// The 3-event switch stays isolated INSIDE this one strategy — genuinely three
// resolution algorithms, one place, exhaustive via assertNever.
export const build__NotificationAddedToAlbumStrategy = ({
  systemAuthorizationRepository,
  systemUserRepository,
}: Deps): NotificationStrategy<'mediaItemAddedToAlbum'> => ({
  handles: ['mediaItemAddedToAlbum'],
  branches: ['inAppWriter', 'asyncWriter'],
  resolve: async (event): Promise<ResolvedNotification> => {
    const { userAuthorizations } = await systemAuthorizationRepository.getAuthorizationsByAlbumId([
      event.albumId,
    ]);
    const recipients = await systemUserRepository.getUserContacts(
      userAuthorizations.map((a) => a.grantedToUser),
    );
    return {
      recipients,
      actorId: event.actorId,
      targetType: NotificationTargetType.album,
      targetId: event.albumId,
      sourceType: NotificationSourceType.mediaItem, // source = the added item
      sourceId: event.mediaItemId,
      kind: NotificationKind.itemAdded,
    };
  },
});

// Was resolveActivity + inAppNotificationHandler + asyncNotificationHandler.
// The 3-event switch stays isolated INSIDE this one strategy — genuinely three
// resolution algorithms, one place, exhaustive via assertNever.
export const build__NotificationAlbumSharedStrategy = ({
  systemUserRepository,
}: Deps): NotificationStrategy<'albumSharedWithUser'> => ({
  handles: ['albumSharedWithUser'],
  branches: ['inAppWriter', 'asyncWriter'],
  resolve: async (event): Promise<ResolvedNotification> => {
    const recipients = await systemUserRepository.getUserContacts([event.userId]);
    return {
      recipients,
      actorId: event.actorId,
      targetType: EntityType.album,
      targetId: event.albumId,
      sourceType: EntityType.album, // degenerate: source == target
      sourceId: event.albumId,
      kind: NotificationKind.albumShared,
    };
  },
});
