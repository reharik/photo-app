import {
  AppErrorCollection,
  EntityType,
  fail,
  ok,
  ReactionEmoji,
  User,
  WriteResult,
} from '@packages/contracts';
import { EnumSubset } from '@reharik/smart-enum';
import { Comment } from '../../../domain';
import { CommentRepository } from '../../../repositories';
import { UserReadRepository } from '../../../repositories/readRepositories/types';
import { EntityId } from '../../../types/types';
import { ValidateOperationService } from '../../readServices/mediaGrantService';
import { ToggleReaction } from '../reactions/toggleReaction';
import { WriteServiceBase } from '../writeServiceBaseType';

export type AddCommentCommand = {
  /**
   * Nullable mirrors the DB column: v1 rejects null authors in the service body,
   * but keeping it nullable here allows the anon-via-share-token path to land
   * on the same command type in a future iteration without a type change.
   */
  authorId: EntityId;
  /**
   * Ignored when parentCommentId is set; the service copies target from the parent.
   */
  targetType: EnumSubset<EntityType, 'mediaItem'>;
  /**
   * Ignored when parentCommentId is set; the service copies target from the parent.
   */
  targetId: EntityId;
  parentCommentId?: EntityId;
  body: string;
  viewer: User;
};

export interface AddComment extends WriteServiceBase {
  (command: AddCommentCommand): Promise<WriteResult<{ entityId: EntityId }>>;
}

type AddCommentDeps = {
  commentRepository: CommentRepository;
  userReadRepository: UserReadRepository;
  validateOperationService: ValidateOperationService;
  toggleReaction: ToggleReaction;
};

export const build__AddComment = ({
  commentRepository,
  userReadRepository,
  validateOperationService,
  toggleReaction,
}: AddCommentDeps): AddComment => {
  return async (command: AddCommentCommand): Promise<WriteResult<{ entityId: EntityId }>> => {
    const result = await validateOperationService.authorizeMediaComment({
      mediaItemId: command.targetId,
      viewerId: command.authorId,
    });
    if (!result.success) {
      return result;
    }
    const user = await userReadRepository.getById(command.authorId);
    if (!user) {
      return fail(AppErrorCollection.user.UserNotFound);
    }
    if (command.parentCommentId) {
      const parentComment = await commentRepository.getById(command.parentCommentId);
      if (!parentComment) {
        return fail(AppErrorCollection.comment.CommentNotFound);
      }
      command.targetType = parentComment.targetType();
      command.targetId = parentComment.targetId();

      if (parentComment.isReply()) {
        return fail(AppErrorCollection.comment.ReplyDepthExceeded);
      }
    }

    // TODO: Look up viewer's display_name and avatar_url from the user table and
    //   snapshot them into the row (denormalized — do not join through user on reads).
    const comment = Comment.create(
      {
        targetType: command.targetType,
        targetId: command.targetId,
        parentCommentId: command.parentCommentId,
        authorId: command.authorId,
        body: command.body,
        displayName: `${user.firstName}, ${user.lastName}`,
        displayAvatarUrl: undefined,
      },
      command.authorId,
    );

    await commentRepository.save(comment);
    await toggleReaction({
      targetType: EntityType.mediaItem,
      targetId: command.targetId,
      emoji: ReactionEmoji.comment,
      viewer: command.viewer,
    });
    return ok({ entityId: comment.id() });
  };
};
