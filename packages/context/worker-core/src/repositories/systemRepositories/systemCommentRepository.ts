import { AuditRecord, EntityId, EntityType } from '@packages/contracts';
import { EnumSubset } from '@reharik/smart-enum';
import { UnitOfWork } from '../../infrastructure';

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

export interface SystemCommentRepository {
  getCommentsByIds: (commentIds: EntityId[]) => Promise<CommentRecord[]>;
}

type systemCommentRepositoryDeps = {
  uow: UnitOfWork;
};

export const build__systemCommentRepository = ({
  uow,
}: systemCommentRepositoryDeps): SystemCommentRepository => ({
  getCommentsByIds: async (commentIds: EntityId[]) => {
    return uow.db()('comment').whereIn('id', commentIds).select<CommentRecord[]>();
  },
});
