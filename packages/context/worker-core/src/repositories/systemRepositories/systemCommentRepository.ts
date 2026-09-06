import { EntityType } from '@packages/contracts';
import { EnumSubset } from '@reharik/smart-enum';
import { AuditRecord } from '../../domain';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import { EntityId } from '../../types';

export type CommentRecord = {
  id: EntityId;
  targetType: EnumSubset<EntityType, 'mediaItem'>;
  targetId: EntityId;
  parentCommentId?: EntityId;
  authorId: EntityId;
  body: string;
  displayName: string;
  displayAvatarUrl?: string;
  deletedAt?: Date;
} & AuditRecord;

export interface SystemCommentRepository extends RequestScopeLifeCycle {
  getCommentsByIds: (commentIds: EntityId[]) => Promise<CommentRecord[]>;
}

type systemCommentRepositoryDeps = {
  uow: UnitOfWork;
};

export const build__systemCommentRepository = ({
  uow,
}: systemCommentRepositoryDeps): SystemCommentRepository => ({
  getCommentsByIds: async (commentIds: EntityId[]) => {
    await uow.join();
    return uow.db()('comment').whereIn('id', commentIds).select<CommentRecord[]>();
  },
});
