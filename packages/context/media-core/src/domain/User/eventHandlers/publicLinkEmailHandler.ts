import { EntityType, PendingNotificationKind } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import {
  SystemAuthorizationRepository,
  SystemPendingNotificationRepository,
  SystemUserRepository,
} from '../../../repositories';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';

type PublicLinkEmailHandlerDeps = {
  systemUserRepository: SystemUserRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
  logger: Logger;
};

export const build__PublicLinkEmailHandler = ({
  systemUserRepository,
  systemAuthorizationRepository,
  systemPendingNotificationRepository,
  logger,
}: PublicLinkEmailHandlerDeps): DomainEventHandler<'publicLinkSharedWithUser'> => ({
  name: 'publicLinkEmailHandler',
  handles: ['publicLinkSharedWithUser'],
  processor: async (event) => {
    const users = await systemUserRepository.getUserContacts([event.userId]);
    const user = users[0];
    if (!user) {
      logger.warn('publicLinkEmailHandler: no user for event', { userId: event.userId });
      return; // permanent — retrying won't help
    }
    const publicLinkAuthorizations = await systemAuthorizationRepository.getAuthorizationsByIds([
      event.publicLinkAuthorizationId,
    ]);
    const publicLinkAuthorization = publicLinkAuthorizations.publicLinkAuthorizations[0];
    if (!publicLinkAuthorization) {
      logger.warn('publicLinkEmailHandler: no public-link authorization', {
        authId: event.publicLinkAuthorizationId,
      });
      return; // permanent
    }
    await systemPendingNotificationRepository.upsertRecipientRow({
      id: crypto.randomUUID(),
      channel: 'email',
      kind: PendingNotificationKind.guestAlbumShared,
      // this table has the recipient email on it and that probably needs to go.
      recipientId: user.id,
      aggregateType: EntityType.album,
      aggregateId: publicLinkAuthorization.target.albumId,
      attempts: 0,
      actorId: event.actorId,
      data: { token: publicLinkAuthorization.linkToken },
    });
  },
});
