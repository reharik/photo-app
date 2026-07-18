import { UserStatus } from '@packages/contracts';
import { SystemAsyncNotificationRepository } from '../../../repositories/systemRepositories/systemAsyncNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { NOTIFICATION_KIND_BY_EVENT } from './mapEventKindToActionKind';
import { ResolveActivity } from './resolveActivity';

type InAppNotificationEmailHandlerDeps = {
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  resolveActivity: ResolveActivity;
};

export const build__InAppNotificationEmailHandler = ({
  systemAsyncNotificationRepository,
  resolveActivity,
}: InAppNotificationEmailHandlerDeps): DomainEventHandler<
  'mediaItemAddedToAlbum' | 'albumSharedWithUser' | 'mediaItemsSharedWithUser'
> => ({
  name: 'InAppNotificationEmail',
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
        return systemAsyncNotificationRepository.upsertRecipientRow({
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
