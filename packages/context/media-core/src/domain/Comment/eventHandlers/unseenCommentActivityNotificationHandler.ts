import { EntityType, InAppNotificationType } from '@packages/contracts';
import { SystemInAppNotificationRepository } from '../../../repositories/systemRepositories/systemInAppNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { ResolveCommentActivity } from './resolveCommentActivity';

type UnseenCommentActivityNotificationHandlerDeps = {
  systemInAppNotificationRepository: SystemInAppNotificationRepository;
  resolveCommentActivity: ResolveCommentActivity;
};

export const build__UnseenCommentActivityNotificationHandler = ({
  systemInAppNotificationRepository,
  resolveCommentActivity,
}: UnseenCommentActivityNotificationHandlerDeps): DomainEventHandler<'commentPosted'> => ({
  name: 'UnseenCommentActivityNotificationHandler',
  handles: ['commentPosted'],
  processor: async (event) => {
    const { recipientId, targetType, targetId, isReplyToComment } =
      await resolveCommentActivity(event);

    if (recipientId === event.actorId) {
      return;
    }
    await systemInAppNotificationRepository.upsertActivityRow({
      id: crypto.randomUUID(),
      viewerId: recipientId,
      targetType,
      targetId,
      activityKind: isReplyToComment
        ? InAppNotificationType.replyPosted
        : InAppNotificationType.commentPosted,
      sourceId: event.commentId,
      sourceType: EntityType.comment,
    });
  },
});
