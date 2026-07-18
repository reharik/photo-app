import { AsyncNotificationKind } from '@packages/contracts';
import { SystemAsyncNotificationRepository } from '../../../repositories/systemRepositories/systemAsyncNotificationRepository';
import { SystemCommentRepository } from '../../../repositories/systemRepositories/systemCommentRepository';
import { SystemMediaItemRepository } from '../../../repositories/systemRepositories/systemMediaItemRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';

type ReactionActivityEmailHandlerDeps = {
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemCommentRepository: SystemCommentRepository;
  systemMediaItemRepository: SystemMediaItemRepository;
};

export const build__ReactionActivityEmailHandler = ({
  systemAsyncNotificationRepository,
  systemCommentRepository,
  systemMediaItemRepository,
}: ReactionActivityEmailHandlerDeps): DomainEventHandler<'reactionAdded'> => ({
  name: 'ReactionActivityEmailHandler',
  handles: ['reactionAdded'],
  processor: async (event) => {
    const { targetType, targetId, actorId } = event;
    const recipientId = await event.targetType.match({
      comment: async () => {
        const comment = await systemCommentRepository.getCommentById(event.targetId);
        return comment.authorId;
      },
      mediaItem: async () => {
        const mediaItem = await systemMediaItemRepository.getMediaItemById(event.targetId);
        return mediaItem.ownerId;
      },
    });
    if (recipientId === actorId) {
      return;
    }
    await systemAsyncNotificationRepository.upsertRecipientRow({
      id: crypto.randomUUID(),
      channel: 'email',
      kind: AsyncNotificationKind.reactionAdded,
      recipientId,
      aggregateType: targetType,
      aggregateId: targetId,
      attempts: 0,
      actorId: actorId,
    });
  },
});
