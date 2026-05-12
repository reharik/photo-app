import { AppErrorCollection } from '@packages/contracts';
import { fail, ok } from '../../../domain';
import { CommentRepository } from '../../../repositories/domainRepositories/commentRepository';
import { EntityId, WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type DeleteCommentCommand = {
  authorId: EntityId;
  commentId: EntityId;
};

export interface DeleteComment extends WriteServiceBase {
  (command: DeleteCommentCommand): Promise<WriteResult<{ entityId: EntityId }>>;
}

type DeleteCommentDeps = { commentRepository: CommentRepository };

export const build__DeleteComment = ({ commentRepository }: DeleteCommentDeps): DeleteComment => {
  return async (command: DeleteCommentCommand): Promise<WriteResult<{ entityId: EntityId }>> => {
    const comment = await commentRepository.getById(command.commentId);
    if (!comment) {
      return fail(AppErrorCollection.comment.CommentNotFound);
    }
    if (comment.authorId() !== command.authorId) {
      return fail(AppErrorCollection.comment.CanNotDeleteComment);
    }
    comment.markDeleted(command.authorId);
    await commentRepository.save(comment);
    return ok({ entityId: comment.id() });
  };
};
