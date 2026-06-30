import { EntityType } from '@packages/contracts';
import { SystemPendingNotificationRepository } from '../../../repositories/systemRepositories/systemPendingNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { AlbumSharedWithUser } from '../albumEvents';

type AlbumSharedWithUserEmailHandlerDeps = {
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
};

export const build__AlbumSharedWithUserEmailHandler = ({
  systemPendingNotificationRepository,
}: AlbumSharedWithUserEmailHandlerDeps): DomainEventHandler<'albumSharedWithUser'> => ({
  handles: ['albumSharedWithUser'],
  processor: async (event: AlbumSharedWithUser) => {
    await systemPendingNotificationRepository.upsertRecipientRow({
      id: crypto.randomUUID(),
      channel: 'email',
      kind: 'albumActivity',
      recipientId: event.userId,
      aggregateType: EntityType.album,
      aggregateId: event.albumId,
      attempts: 0,
    });
  },
});

/////////////
// we need a type on the pending notification to say "this is a batch" or "this should go out immediately"
/////////////
