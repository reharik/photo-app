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
  | 'mediaItemAddedToAlbum'
  | 'albumSharedWithUser'
  | 'mediaItemsSharedWithUser'
  | 'albumSharedWithNonUser'
> => ({
  name: 'UnseenActivityEmail',
  handles: [
    'mediaItemAddedToAlbum',
    'albumSharedWithUser',
    'mediaItemsSharedWithUser',
    'albumSharedWithNonUser',
  ],
  processor: async (event) => {
    const { recipients, targetType, targetId, token } = await resolveActivity(event);
    const kind = NOTIFICATION_KIND_BY_EVENT[event.kind];
    await Promise.all(
      recipients.map((recipientId) => {
        const identifier =
          'recipientAddress' in event ? { recipientAddress: recipientId } : { recipientId };
        const tokenValue = token ? { data: { token } } : {};
        return systemPendingNotificationRepository.upsertRecipientRow({
          id: crypto.randomUUID(),
          channel: 'email',
          kind,
          ...identifier,
          aggregateType: targetType,
          aggregateId: targetId,
          attempts: 0,
          actorId: event.actorId,
          ...tokenValue,
        });
      }),
    );
  },
});
