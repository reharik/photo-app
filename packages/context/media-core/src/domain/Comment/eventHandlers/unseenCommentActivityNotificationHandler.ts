import { EntityType, UnseenActivityType } from '@packages/contracts';
import { SystemUnseenActivityRepository } from '../../../repositories/systemRepositories/systemUnseenActivityRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { ResolveCommentActivity } from './resolveCommentActivity';

type UnseenCommentActivityNotificationHandlerDeps = {
  systemUnseenActivityRepository: SystemUnseenActivityRepository;
  resolveCommentActivity: ResolveCommentActivity;
};

export const build__UnseenCommentActivityNotificationHandler = ({
  systemUnseenActivityRepository,
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
    await systemUnseenActivityRepository.upsertActivityRow({
      id: crypto.randomUUID(),
      viewerId: recipientId,
      targetType,
      targetId,
      activityKind: isReplyToComment
        ? UnseenActivityType.replyPosted
        : UnseenActivityType.commentPosted,
      sourceId: event.commentId,
      sourceType: EntityType.comment,
    });
  },
});
