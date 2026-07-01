import { EntityType } from '@packages/contracts';
import { SystemAuthorizationRepository } from '../../../repositories/systemRepositories/systemAuthorizationRepository';
import { SystemPendingNotificationRepository } from '../../../repositories/systemRepositories/systemPendingNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { MediaItemAddedToAlbum } from '../albumEvents';

type UnseenActivityEmailHandlerDeps = {
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
};

export const build__UnseenActivityEmailHandler = ({
  systemPendingNotificationRepository,
  systemAuthorizationRepository,
}: UnseenActivityEmailHandlerDeps): DomainEventHandler<'mediaItemAddedToAlbum'> => ({
  name: 'UnseenActivityEmailHandler',
  handles: ['mediaItemAddedToAlbum'],
  processor: async (event: MediaItemAddedToAlbum) => {
    const recipients = await systemAuthorizationRepository.getAuthorizationsByAlbumId([
      event.albumId,
    ]);

    const mutations = recipients
      // authorization is not a public token auth
      //  and it is not pointed at the person who just added the image
      .filter((x) => x.grantedToUser && x.grantedToUser !== event.actorId)
      .map((x) =>
        systemPendingNotificationRepository.upsertRecipientRow({
          id: crypto.randomUUID(),
          channel: 'email',
          kind: 'albumActivity',
          recipientId: x.grantedToUser,
          aggregateType: EntityType.album,
          aggregateId: event.albumId,
          attempts: 0,
        }),
      );
    await Promise.all(mutations);
  },
});
