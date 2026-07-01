import { SystemPendingNotificationRepository } from '../../../repositories/systemRepositories/systemPendingNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { ResolveActivity } from './resolveActivity';

type UnseenActivityEmailHandlerDeps = {
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
  resolveActivity: ResolveActivity;
};

export const build__UnseenActivityEmailHandler = ({
  systemPendingNotificationRepository,
  resolveActivity,
}: UnseenActivityEmailHandlerDeps): DomainEventHandler<
  'mediaItemAddedToAlbum' | 'albumSharedWithUser'
> => ({
  name: 'UnseenActivityEmail',
  handles: ['mediaItemAddedToAlbum', 'albumSharedWithUser'],
  processor: async (event) => {
    const { recipients, targetType, albumId } = await resolveActivity(event);
    // event.kind → pending-notification `kind`. STEP 0 found both source
    // handlers wrote the same 'albumActivity' kind, so the map is constant for
    // both mediaItemAddedToAlbum and albumSharedWithUser.
    const kind = 'albumActivity';
    await Promise.all(
      recipients.map((recipientId) =>
        systemPendingNotificationRepository.upsertRecipientRow({
          id: crypto.randomUUID(),
          channel: 'email',
          kind,
          recipientId,
          aggregateType: targetType,
          aggregateId: albumId,
          attempts: 0,
        }),
      ),
    );
  },
});
