import { UserStatus } from '@packages/contracts';
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
    const { recipients, targetType, targetId, token } = await resolveActivity(event);
    const kind = NOTIFICATION_KIND_BY_EVENT[event.kind];
    let filteredRecipients = recipients;
    if (event.kind === 'mediaItemAddedToAlbum') {
      filteredRecipients = recipients.filter((x) => x.userStatus.equals(UserStatus.active));
    }
    await Promise.all(
      filteredRecipients.map((recipient) => {
        const tokenValue = token ? { data: { token } } : {};
        return systemPendingNotificationRepository.upsertRecipientRow({
          id: crypto.randomUUID(),
          channel: 'email',
          kind,
          // this table has the recipient email on it and that probably needs to go.
          recipientId: recipient.id,
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
