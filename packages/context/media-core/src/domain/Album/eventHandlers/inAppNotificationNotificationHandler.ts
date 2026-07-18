import { UserStatus } from '@packages/contracts';
import { SystemInAppNotificationRepository } from '../../../repositories/systemRepositories/systemInAppNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { UNSEEN_KIND_BY_EVENT } from './mapEventKindToActionKind';
import { ResolveActivity } from './resolveActivity';

type InAppNotificationNotificationHandlerDeps = {
  systemInAppNotificationRepository: SystemInAppNotificationRepository;
  resolveActivity: ResolveActivity;
};

// OK. Gotta go, what's left is
// * update resolveActivity to take both new events
// * update handlers to take both new events
// * update fastSweepNotificationTask to handle both new events
// * add/update e2e tests
export const build__InAppNotificationNotificationHandler = ({
  systemInAppNotificationRepository,
  resolveActivity,
}: InAppNotificationNotificationHandlerDeps): DomainEventHandler<
  'mediaItemAddedToAlbum' | 'albumSharedWithUser' | 'mediaItemsSharedWithUser'
> => ({
  name: 'InAppNotificationNotification',
  handles: ['mediaItemAddedToAlbum', 'albumSharedWithUser', 'mediaItemsSharedWithUser'],
  processor: async (event) => {
    const { recipients, targetType, targetId, sourceType, sourceId } = await resolveActivity(event);
    const activityKind = UNSEEN_KIND_BY_EVENT[event.kind];

    await Promise.all(
      recipients
        .filter((x) => x.userStatus.equals(UserStatus.active))
        .map((recipient) =>
          systemInAppNotificationRepository.upsertActivityRow({
            id: crypto.randomUUID(),
            viewerId: recipient.id,
            targetType,
            targetId,
            sourceType,
            sourceId,
            activityKind,
          }),
        ),
    );
  },
});
