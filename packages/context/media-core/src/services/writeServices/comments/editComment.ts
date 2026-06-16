import { AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import { Knex } from 'knex';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
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

type EditCommentDeps = { commentRepository: CommentRepository; runInTransaction: RunInTransaction };

export const build__EditComment = ({
  commentRepository,
  runInTransaction,
}: EditCommentDeps): EditComment => {
  return async (
    command: EditCommentCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<{ entityId: EntityId }>> => {
    const comment = await commentRepository.getById(command.commentId);
    if (!comment) {
      return fail(AppErrorCollection.comment.CommentNotFound);
    }
    if (comment.authorId() !== command.authorId) {
      return fail(AppErrorCollection.comment.CommentNotFound);
    }
    comment.editBody(command.body, command.authorId);
    await runInTransaction(trx, async (db) => {
      await commentRepository.save(comment, db);
    });
    return ok({ entityId: comment.id() });
  };
};
