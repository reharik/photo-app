import { SystemAuthorizationRepository } from '../../../repositories/systemRepositories/systemAuthorizationRepository';
import { SystemPendingNotificationRepository } from '../../../repositories/systemRepositories/systemPendingNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { MediaItemAddedToAlbum } from '../albumEvents';

type RecordPendingNotificationDeps = {
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
};

export const build__RecordPendingNotification = ({
  systemPendingNotificationRepository,
  systemAuthorizationRepository,
}: RecordPendingNotificationDeps): DomainEventHandler<'mediaItemAddedToAlbum'> => ({
  handles: ['mediaItemAddedToAlbum'],
  processor: async (event: MediaItemAddedToAlbum) => {
    const recipients = await systemAuthorizationRepository.getAuthorizationsByAlbumId([
      event.albumId,
    ]);

    const mutations = recipients.map((x) =>
      systemPendingNotificationRepository.upsertRecipientRow({
        id: crypto.randomUUID(),
        channel: 'email',
        kind: 'albumActivity',
        recipientId: x.grantedToUser,
        aggregateType: 'album',
        aggregateId: event.albumId,
        attempts: 0,
      }),
    );
    await Promise.all(mutations);
  },
});
