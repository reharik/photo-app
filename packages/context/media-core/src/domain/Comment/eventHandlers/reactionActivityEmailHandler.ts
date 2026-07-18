import { PendingNotificationKind } from '@packages/contracts';
import { SystemCommentRepository } from '../../../repositories/systemRepositories/systemCommentRepository';
import { SystemMediaItemRepository } from '../../../repositories/systemRepositories/systemMediaItemRepository';
import { SystemPendingNotificationRepository } from '../../../repositories/systemRepositories/systemPendingNotificationRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';

type ReactionActivityEmailHandlerDeps = {
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
  systemCommentRepository: SystemCommentRepository;
  systemMediaItemRepository: SystemMediaItemRepository;
};

export const build__ReactionActivityEmailHandler = ({
  systemPendingNotificationRepository,
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
    await systemPendingNotificationRepository.upsertRecipientRow({
      id: crypto.randomUUID(),
      channel: 'email',
      kind: PendingNotificationKind.reactionAdded,
      recipientId,
      aggregateType: targetType,
      aggregateId: targetId,
      attempts: 0,
      actorId: actorId,
    });
  },
});
