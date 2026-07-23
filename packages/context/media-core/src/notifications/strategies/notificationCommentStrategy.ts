import { NotificationKind, NotificationSubjectType } from '@packages/contracts';
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
      : (await systemMediaItemRepository.getMediaItemById(event.containerId)).ownerId;

    // Hydrate for status so the self/active guards apply uniformly in the dispatcher.
    const [recipient] = await systemUserRepository.getUserContacts([recipientId]);

    return {
      recipients: recipient ? [recipient] : [],
      actorId: event.authorId,
      containerType: event.containerType, // the media item the comment is on
      containerId: event.containerId,
      subjectType: NotificationSubjectType.comment, // subject = the comment (first-class; no more data.commentId)
      subjectId: event.commentId,
      kind: isReply ? NotificationKind.replyPosted : NotificationKind.commentPosted,
    };
  },
});
