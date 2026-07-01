import {
  PendingNotificationKind,
  SystemPendingNotificationRepository,
} from '../../../repositories/systemRepositories/systemPendingNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { assertNever, ResolveActivity } from './resolveActivity';

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
    const kind: PendingNotificationKind =
      event.kind === 'albumSharedWithUser'
        ? 'albumShared'
        : event.kind === 'mediaItemAddedToAlbum'
          ? 'itemAdded'
          : assertNever(event);
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
          actorId: event.actorId,
        }),
      ),
    );
  },
});
