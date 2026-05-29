import { AppErrorCollection, CommentTargetType } from '@packages/contracts';
import { Knex } from 'knex';
import { Comment, fail, ok } from '../../../domain';
import { CommentRepository } from '../../../repositories';
import { UserReadRepository } from '../../../repositories/readRepositories/types';
import { EntityId, WriteResult } from '../../../types/types';
import { ValidateOperationService } from '../../readServices/mediaGrantService';
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
  targetType: CommentTargetType;
  /**
   * Ignored when parentCommentId is set; the service copies target from the parent.
   */
  targetId: EntityId;
  parentCommentId?: EntityId;
  body: string;
};

export interface AddComment extends WriteServiceBase {
  (command: AddCommentCommand): Promise<WriteResult<{ entityId: EntityId }>>;
}

type AddCommentDeps = {
  commentRepository: CommentRepository;
  userReadRepository: UserReadRepository;
  validateOperationService: ValidateOperationService;
  database: Knex;
};

export const build__AddComment = ({
  commentRepository,
  userReadRepository,
  validateOperationService,
  database,
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
      const comment = Comment.create(
        {
          ...command,
          authorId: command.authorId,
          displayName: `${user.firstName}, ${user.lastName}`,
          displayAvatarUrl: undefined,
        },
        command.authorId,
      );

      await database.transaction(async (trx) => {
        await commentRepository.save(comment, trx);
      });
      return ok({ entityId: comment.id() });
    } else {
      // TODO: Look up viewer's display_name and avatar_url from the user table and
      //   snapshot them into the row (denormalized — do not join through user on reads).
      const comment = Comment.create(
        {
          ...command,
          authorId: command.authorId,
          displayName: `${user.firstName}, ${user.lastName}`,
          displayAvatarUrl: undefined,
        },
        command.authorId,
      );

      await database.transaction(async (trx) => {
        await commentRepository.save(comment, trx);
      });
      return ok({ entityId: comment.id() });
    }
  };
};
