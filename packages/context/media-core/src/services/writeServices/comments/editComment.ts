import { AppErrorCollection } from '@packages/contracts';
import { Knex } from 'knex';
import { fail, ok } from '../../../domain';
import { CommentRepository } from '../../../repositories/domainRepositories/commentRepository';
import { EntityId, WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type EditCommentCommand = {
  authorId: EntityId;
  commentId: EntityId;
  body: string;
};

export interface EditComment extends WriteServiceBase {
  (command: EditCommentCommand): Promise<WriteResult<{ entityId: EntityId }>>;
}

type EditCommentDeps = { commentRepository: CommentRepository; database: Knex };

export const build__EditComment = ({
  commentRepository,
  database,
}: EditCommentDeps): EditComment => {
  return async (command: EditCommentCommand): Promise<WriteResult<{ entityId: EntityId }>> => {
    const comment = await commentRepository.getById(command.commentId);
    if (!comment) {
      return fail(AppErrorCollection.comment.CommentNotFound);
    }
    if (comment.authorId() !== command.authorId) {
      return fail(AppErrorCollection.comment.CommentNotFound);
    }
    comment.editBody(command.body, command.authorId);
    await database.transaction(async (trx) => {
      await commentRepository.save(comment, trx);
    });
    return ok({ entityId: comment.id() });
  };
};
