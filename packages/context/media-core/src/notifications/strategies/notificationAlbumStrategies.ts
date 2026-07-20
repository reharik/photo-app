import {
  EntityType,
  NotificationContainerType,
  NotificationKind,
  NotificationSubjectType,
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
      containerType: NotificationContainerType.album,
      containerId: event.albumId,
      subjectType: NotificationSubjectType.mediaItem, // subject = the added item
      subjectId: event.mediaItemId,
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
      containerType: EntityType.album,
      containerId: event.albumId,
      subjectType: EntityType.album, // degenerate: subject == container
      subjectId: event.albumId,
      kind: NotificationKind.albumShared,
    };
  },
});
