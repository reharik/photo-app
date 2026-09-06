import { EntityType } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { EntityId, PageInfo } from '../../types/types';
import type { CommentReadRepository, DBCommentRow, ReadRepositoryDeps } from './types';

const commentSelectColumns = [
  'id',
  'target_type',
  'target_id',
  'parent_comment_id',
  'author_id',
  'body',
  'display_name',
  'display_avatar_url',
  'created_at',
  'updated_at',
  'deleted_at',
  'reaction_counts',
];

export const build__CommentReadRepository = ({
  uow,
}: ReadRepositoryDeps): CommentReadRepository => ({
  getCommentsForTarget: async ({
    targetType,
    targetId,
    collectionInfo,
  }: {
    targetType: EntityType;
    targetId: EntityId;
    collectionInfo: { pageInfo: PageInfo };
  }): Promise<DBCommentRow[]> => {
    await uow.join();
    const { pageInfo } = collectionInfo;
    return withEnumRevival(
      uow
        .db()('comment')
        .select(...commentSelectColumns)
        .select(uow.db().raw('COUNT(*) OVER () AS "totalCount"'))
        .where('target_type', targetType)
        .where('target_id', targetId)
        .whereNull('deleted_at')
        .limit(pageInfo.limit)
        .offset(pageInfo.offset),

      { targetType: EntityType },
    );
  },
  getByIdForAuthorization: async ({
    commentId,
  }: {
    commentId: EntityId;
  }): Promise<DBCommentRow | undefined> => {
    await uow.join();
    return withEnumRevival(
      uow
        .db()('comment')
        .select(...commentSelectColumns)
        .where('id', commentId)
        .first<DBCommentRow>(...commentSelectColumns),
      { targetType: EntityType },
    );
  },
});
