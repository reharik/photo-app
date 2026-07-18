import { PendingNotificationKind } from '@packages/contracts';
import { SystemPendingNotificationRepository } from '../../../repositories/systemRepositories/systemPendingNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { ResolveCommentActivity } from './resolveCommentActivity';

type UnseenCommentActivityEmailHandlerDeps = {
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
  resolveCommentActivity: ResolveCommentActivity;
};

export const build__UnseenCommentActivityEmailHandler = ({
  systemPendingNotificationRepository,
  resolveCommentActivity,
}: UnseenCommentActivityEmailHandlerDeps): DomainEventHandler<'commentPosted'> => ({
  name: 'UnseenCommentActivityEmail',
  handles: ['commentPosted'],
  processor: async (event) => {
    const { recipientId, posterId, targetType, targetId, isReplyToComment, commentId } =
      await resolveCommentActivity(event);

    if (recipientId === event.actorId) {
      return;
    }

    await systemPendingNotificationRepository.upsertRecipientRow({
      id: crypto.randomUUID(),
      channel: 'email',
      kind: isReplyToComment
        ? PendingNotificationKind.replyPosted
        : PendingNotificationKind.commentPosted,
      recipientId: recipientId,
      aggregateType: targetType,
      aggregateId: targetId,
      attempts: 0,
      actorId: posterId,
      data: { commentId },
    });
  },
});
