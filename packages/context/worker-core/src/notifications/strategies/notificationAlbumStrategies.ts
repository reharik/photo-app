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
  name: 'NotificationAddedToAlbumStrategy',
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
  name: 'NotificationAlbumSharedStrategy',
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
      // subjectId is the album here, so the grant would otherwise be lost at the queue
      // boundary — this is the only place it exists.
      accessGrantId: event.authorizationId,
      kind: NotificationKind.albumShared,
    };
  },
});

export const build__NotificationGuestAlbumSharedStrategy = ({
  systemUserRepository,
}: Deps): NotificationStrategy<'albumSharedWithPendingUser'> => ({
  name: 'NotificationGuestAlbumSharedStrategy',
  handles: ['albumSharedWithPendingUser'],
  branches: ['asyncWriter'],
  resolve: async (event): Promise<ResolvedNotification> => {
    const recipients = await systemUserRepository.getUserContacts([event.userId]);
    return {
      recipients,
      actorId: event.actorId,
      containerType: EntityType.album,
      containerId: event.albumId,
      subjectType: EntityType.authorization, // degenerate: subject == container
      subjectId: event.authorizationId,
      // Redundant with subjectId for this kind, and deliberately so: subjectId means
      // "the generator" and only happens to be a grant here, whereas accessGrantId
      // means "the grant" for every kind that has one. The send path reads the latter.
      accessGrantId: event.authorizationId,
      kind: NotificationKind.guestAlbumShared,
    };
  },
});
