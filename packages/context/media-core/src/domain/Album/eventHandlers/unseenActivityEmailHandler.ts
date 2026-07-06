import { SystemPendingNotificationRepository } from '../../../repositories/systemRepositories/systemPendingNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { NOTIFICATION_KIND_BY_EVENT } from './mapEventKindToActionKind';
import { ResolveActivity } from './resolveActivity';

type UnseenActivityEmailHandlerDeps = {
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
  resolveActivity: ResolveActivity;
};

export const build__UnseenActivityEmailHandler = ({
  systemPendingNotificationRepository,
  resolveActivity,
}: UnseenActivityEmailHandlerDeps): DomainEventHandler<
  'mediaItemAddedToAlbum' | 'albumSharedWithUser' | 'mediaItemsSharedWithUser'
> => ({
  name: 'UnseenActivityEmail',
  handles: ['mediaItemAddedToAlbum', 'albumSharedWithUser', 'mediaItemsSharedWithUser'],
  processor: async (event) => {
    const { recipients, targetType, targetId } = await resolveActivity(event);
    const kind = NOTIFICATION_KIND_BY_EVENT[event.kind];
    await Promise.all(
      recipients.map((recipientId) =>
        systemPendingNotificationRepository.upsertRecipientRow({
          id: crypto.randomUUID(),
          channel: 'email',
          kind,
          recipientId,
          aggregateType: targetType,
          aggregateId: targetId,
          attempts: 0,
          actorId: event.actorId,
        }),
      ),
    );
  },
});
