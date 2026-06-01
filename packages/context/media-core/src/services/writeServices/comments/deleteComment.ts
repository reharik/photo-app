import { AppErrorCollection } from '@packages/contracts';
import { Knex } from 'knex';
import { RunInTransaction } from 'src/infrastructure/repositories/runInTransaction';
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

type DeleteCommentDeps = {
  commentRepository: CommentRepository;
  runInTransaction: RunInTransaction;
};

export const build__DeleteComment = ({
  commentRepository,
  runInTransaction,
}: DeleteCommentDeps): DeleteComment => {
  return async (
    command: DeleteCommentCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<{ entityId: EntityId }>> => {
    const comment = await commentRepository.getById(command.commentId);
    if (!comment) {
      return fail(AppErrorCollection.comment.CommentNotFound);
    }
    if (comment.authorId() !== command.authorId) {
      return fail(AppErrorCollection.comment.CanNotDeleteComment);
    }
    comment.markDeleted(command.authorId);
    await runInTransaction(trx, async (db) => {
      await commentRepository.save(comment, db);
    });
    return ok({ entityId: comment.id() });
  };
};
