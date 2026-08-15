import {
  NotificationContainerType,
  NotificationKind,
  NotificationSubjectType,
} from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { SystemAuthorizationRepository, SystemUserRepository } from '../../repositories';
import { NotificationStrategy, ResolvedNotification } from '../types';

type Deps = {
  systemUserRepository: SystemUserRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
  logger: Logger;
};

export const build__NotificationPendingUserStrategy = ({
  systemUserRepository,
  systemAuthorizationRepository,
  logger,
}: Deps): NotificationStrategy<'albumSharedWithPendingUser'> => ({
  name: 'NotificationPendingUserStrategy',
  handles: ['albumSharedWithPendingUser'],
  branches: ['asyncWriter'],
  resolve: async (event): Promise<ResolvedNotification> => {
    logger.info(
      `[PendingUserStrategy] Handling message for publicLinkSharedWithUser | albumSharedWithPendingUser`,
    );
    const recipients = await systemUserRepository.getUserContacts([event.userId]);
    const pendingUserAuthorization =
      await systemAuthorizationRepository.getPendingUserAuthorizationById(event.authorizationId);
    return {
      recipients,
      actorId: event.actorId,
      containerType: NotificationContainerType.album,
      containerId: pendingUserAuthorization.albumId,
      subjectType: NotificationSubjectType.authorization,
      subjectId: pendingUserAuthorization.id,
      kind: NotificationKind.guestAlbumShared,
    };
  },
});
