import { UnseenActivityType } from '@packages/contracts';
import { SystemUnseenActivityRepository } from '../../../repositories/systemRepositories/systemUnseenActivityRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { ResolveActivity } from './resolveActivity';

type UnseenActivityNotificationHandlerDeps = {
  systemUnseenActivityRepository: SystemUnseenActivityRepository;
  resolveActivity: ResolveActivity;
};

export const build__UnseenActivityNotificationHandler = ({
  systemUnseenActivityRepository,
  resolveActivity,
}: UnseenActivityNotificationHandlerDeps): DomainEventHandler<
  'mediaItemAddedToAlbum' | 'albumSharedWithUser'
> => ({
  name: 'UnseenActivityNotification',
  handles: ['mediaItemAddedToAlbum', 'albumSharedWithUser'],
  processor: async (event) => {
    const { recipients, targetType, targetId, albumId } = await resolveActivity(event);
    const activityKind =
      event.kind === 'mediaItemAddedToAlbum'
        ? UnseenActivityType.itemAdded
        : UnseenActivityType.albumShared;
    await Promise.all(
      recipients.map((viewerId) =>
        systemUnseenActivityRepository.upsertActivityRow({
          id: crypto.randomUUID(),
          viewerId,
          targetType,
          targetId,
          albumId,
          activityKind,
        }),
      ),
    );
  },
});
