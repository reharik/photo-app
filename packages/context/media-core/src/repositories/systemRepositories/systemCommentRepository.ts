import { EntityId } from '@packages/contracts';
import { CommentRecord } from '../../domain';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';

export interface SystemCommentRepository extends RequestScopeLifeCycle {
  getCommentById: (commentId: EntityId) => Promise<CommentRecord>;
}

type systemCommentRepositoryDeps = {
  uow: UnitOfWork;
};

export const build__systemCommentRepository = ({
  uow,
}: systemCommentRepositoryDeps): SystemCommentRepository => ({
  getCommentById: async (commentId: EntityId) => {
    return uow.db()('comment').where({ id: commentId }).first<CommentRecord>();
  },
});
