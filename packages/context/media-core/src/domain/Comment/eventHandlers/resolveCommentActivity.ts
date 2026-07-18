import { EntityType } from '@packages/contracts';
import { EnumSubset } from '@reharik/smart-enum';
import { SystemCommentRepository } from '../../../repositories/systemRepositories/systemCommentRepository';
import { SystemMediaItemRepository } from '../../../repositories/systemRepositories/systemMediaItemRepository';
import { EntityId } from '../../../types';
import { DomainEvent } from '../../domainEvents/DomainEvent';

export type CommentActivityEvent = Extract<
  DomainEvent,
  {
    kind: 'commentPosted';
  }
>;

export type ResolvedCommentActivity = {
  recipientId: EntityId;
  posterId: EntityId;
  targetType: EnumSubset<EntityType, 'mediaItem' | 'album'>;
  targetId: EntityId;
  isReplyToComment: boolean;
  commentId: EntityId;
};

export type ResolveCommentActivity = (
  event: CommentActivityEvent,
) => Promise<ResolvedCommentActivity>;

type ResolveCommentActivityDeps = {
  systemCommentRepository: SystemCommentRepository;
  systemMediaItemRepository: SystemMediaItemRepository;
};

export const build__ResolveCommentActivity =
  ({
    systemCommentRepository,
    systemMediaItemRepository,
  }: ResolveCommentActivityDeps): ResolveCommentActivity =>
  async (event) => {
    let recipientId: EntityId = '';
    if (event.parentCommentId) {
      const parentComment = await systemCommentRepository.getCommentById(event.parentCommentId);
      recipientId = parentComment.authorId;
    } else {
      const mediaItem = await systemMediaItemRepository.getMediaItemById(event.targetId);
      recipientId = mediaItem.ownerId;
    }

    return {
      recipientId,
      posterId: event.authorId,
      isReplyToComment: !!event.parentCommentId,
      targetId: event.targetId,
      targetType: event.targetType,
      commentId: event.commentId,
    };
  };
