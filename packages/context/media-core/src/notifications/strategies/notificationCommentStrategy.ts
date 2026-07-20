import { NotificationKind, NotificationSourceType } from '@packages/contracts';
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

// Was resolveCommentActivity + inAppNotificationCommentHandler + asyncNotificationCommentHandler.
// One strategy, both branches. The reply/root fork resolves to the notification kind HERE.
export const build__NotificationCommentStrategy = ({
  systemCommentRepository,
  systemMediaItemRepository,
  systemUserRepository,
}: Deps): NotificationStrategy<'commentPosted'> => ({
  handles: ['commentPosted'],
  branches: ['inAppWriter', 'asyncWriter'],
  resolve: async (event) => {
    const isReply = !!event.parentCommentId;

    const recipientId = isReply
      ? (await systemCommentRepository.getCommentById(event.parentCommentId!)).authorId
      : (await systemMediaItemRepository.getMediaItemById(event.targetId)).ownerId;

    // Hydrate for status so the self/active guards apply uniformly in the dispatcher.
    const [recipient] = await systemUserRepository.getUserContacts([recipientId]);

    return {
      recipients: recipient ? [recipient] : [],
      actorId: event.authorId,
      targetType: event.targetType, // the media item the comment is on
      targetId: event.targetId,
      sourceType: NotificationSourceType.comment, // source = the comment (first-class; no more data.commentId)
      sourceId: event.commentId,
      kind: isReply ? NotificationKind.replyPosted : NotificationKind.commentPosted,
    };
  },
});
