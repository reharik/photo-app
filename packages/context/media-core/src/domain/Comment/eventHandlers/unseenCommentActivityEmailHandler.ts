import { AsyncNotificationKind } from '@packages/contracts';
import { SystemAsyncNotificationRepository } from '../../../repositories/systemRepositories/systemAsyncNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { ResolveCommentActivity } from './resolveCommentActivity';

type UnseenCommentActivityEmailHandlerDeps = {
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  resolveCommentActivity: ResolveCommentActivity;
};

export const build__UnseenCommentActivityEmailHandler = ({
  systemAsyncNotificationRepository,
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

    await systemAsyncNotificationRepository.upsertRecipientRow({
      id: crypto.randomUUID(),
      channel: 'email',
      kind: isReplyToComment
        ? AsyncNotificationKind.replyPosted
        : AsyncNotificationKind.commentPosted,
      recipientId: recipientId,
      aggregateType: targetType,
      aggregateId: targetId,
      attempts: 0,
      actorId: posterId,
      data: { commentId },
    });
  },
});
