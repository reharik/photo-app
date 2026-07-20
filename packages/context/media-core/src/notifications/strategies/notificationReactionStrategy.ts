import { EntityType, NotificationKind } from '@packages/contracts';
import {
  SystemCommentRepository,
  SystemMediaItemRepository,
  SystemUserRepository,
} from '../../repositories';
import { NotificationStrategy } from '../types';

type Deps = {
  systemCommentRepository: SystemCommentRepository;
  systemMediaItemRepository: SystemMediaItemRepository;
  systemUserRepository: SystemUserRepository;
};

// Was the inline match in asyncNotificationReactionHandler. Now a strategy, and the
// async-only-ness is DECLARED (branches: ['async']) rather than expressed as a missing
// in-app handler. Source == target (degenerate): nobody navigates to a specific reaction.
export const build__NotificationReactionStrategy = ({
  systemCommentRepository,
  systemMediaItemRepository,
  systemUserRepository,
}: Deps): NotificationStrategy<'reactionAdded'> => ({
  handles: ['reactionAdded'],
  branches: ['asyncWriter'], // <- the grid hole, as data
  resolve: async (event) => {
    let recipientId;
    if (event.targetType.equals(EntityType.comment)) {
      recipientId = (await systemCommentRepository.getCommentById(event.targetId)).authorId;
    } else if (event.targetType.equals(EntityType.mediaItem)) {
      recipientId = (await systemMediaItemRepository.getMediaItemById(event.targetId)).ownerId;
    } else {
      throw new Error('[Notification recipientStrategy]: invalid target type');
    }

    const [recipient] = await systemUserRepository.getUserContacts([recipientId]);

    return {
      recipients: recipient ? [recipient] : [],
      actorId: event.actorId,
      targetType: event.targetType,
      targetId: event.targetId,
      sourceType: event.targetType, // degenerate: source == target
      sourceId: event.targetId,
      kind: NotificationKind.reactionAdded,
    };
  },
});
