import { AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import { CommentRepository } from '../../../repositories/domainRepositories/commentRepository';
import { EntityId } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type EditCommentCommand = {
  authorId: EntityId;
  commentId: EntityId;
  body: string;
};

export interface EditComment extends WriteServiceBase {
  (command: EditCommentCommand): Promise<WriteResult<{ entityId: EntityId }>>;
}

type EditCommentDeps = { commentRepository: CommentRepository };

export const build__EditComment = ({ commentRepository }: EditCommentDeps): EditComment => {
  return async (command: EditCommentCommand): Promise<WriteResult<{ entityId: EntityId }>> => {
    const comment = await commentRepository.getById(command.commentId);
    if (!comment) {
      return fail(AppErrorCollection.comment.CommentNotFound);
    }
    if (comment.authorId() !== command.authorId) {
      return fail(AppErrorCollection.comment.CommentNotFound);
    }
    comment.editBody(command.body, command.authorId);
    await commentRepository.save(comment);
    return ok({ entityId: comment.id() });
  };
};
