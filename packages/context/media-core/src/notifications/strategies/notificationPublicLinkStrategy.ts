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

export const build__NotificationPublicLinkStrategy = ({
  systemUserRepository,
  systemAuthorizationRepository,
  logger,
}: Deps): NotificationStrategy<'publicLinkSharedWithUser'> => ({
  handles: ['publicLinkSharedWithUser'],
  branches: ['asyncWriter'],
  resolve: async (event): Promise<ResolvedNotification> => {
    logger.info(`[PublicLinkStrategy] Handling message for publicLinkSharedWithUser`);
    const recipients = await systemUserRepository.getUserContacts([event.userId]);
    const publicLinkAuthorization =
      await systemAuthorizationRepository.getPublicLinkAuthorizationById(
        event.publicLinkAuthorizationId,
      );
    return {
      recipients,
      actorId: event.actorId,
      containerType: NotificationContainerType.album,
      containerId: publicLinkAuthorization.target.albumId,
      subjectType: NotificationSubjectType.authorization,
      subjectId: publicLinkAuthorization.id,
      kind: NotificationKind.guestAlbumShared,
    };
  },
});
