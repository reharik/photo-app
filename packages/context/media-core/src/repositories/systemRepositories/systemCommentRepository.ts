import { CommentRecord } from '../../domain';
import { UnitOfWork } from '../../infrastructure';
import { EntityId } from '../../types';

export type SystemCommentRepository = {
  getCommentById: (commentId: EntityId) => Promise<CommentRecord>;
  getCommentsByIds: (commentIds: EntityId[]) => Promise<CommentRecord[]>;
};

type systemCommentRepositoryDeps = {
  uow: UnitOfWork;
};

export const build__systemCommentRepository = ({
  uow,
}: systemCommentRepositoryDeps): SystemCommentRepository => ({
  getCommentById: async (commentId: EntityId) => {
    await uow.join();
    return uow.db()('comment').where({ id: commentId }).first<CommentRecord>();
  },
  getCommentsByIds: async (commentIds: EntityId[]) => {
    await uow.join();
    return uow.db()('comment').whereIn('id', commentIds).select<CommentRecord[]>();
  },
});
