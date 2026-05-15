import { CommentTargetType } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { CommentRow } from '../../services/readServices/types';
import type { EntityId, PageInfo } from '../../types/types';

export type DBCommentRow = Omit<CommentRow, 'reactionCounts'> & {
  reactionCounts: { total: number; byEmoji: { emoji: string; count: number }[] };
};

export type CommentReadRepository = {
  getCommentsForTarget: (args: {
    targetType: CommentTargetType;
    targetId: EntityId;
    collectionInfo: { pageInfo: PageInfo };
  }) => Promise<DBCommentRow[]>;
  getByIdForAuthorization: (args: { commentId: EntityId }) => Promise<DBCommentRow | undefined>;
};

type CommentReadRepositoryDeps = { database: Knex };

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
  database,
}: CommentReadRepositoryDeps): CommentReadRepository => ({
  getCommentsForTarget: async ({
    targetType,
    targetId,
    collectionInfo,
  }: {
    targetType: CommentTargetType;
    targetId: EntityId;
    collectionInfo: { pageInfo: PageInfo };
  }): Promise<DBCommentRow[]> => {
    const { pageInfo } = collectionInfo;
    return withEnumRevival(
      database('comment')
        .select(...commentSelectColumns)
        .select(database.raw('COUNT(*) OVER () AS "totalCount"'))
        .where('target_type', targetType)
        .where('target_id', targetId)
        .whereNull('deleted_at')
        .limit(pageInfo.limit)
        .offset(pageInfo.offset),

      { targetType: CommentTargetType },
      { strict: true },
    );
  },
  getByIdForAuthorization: async ({
    commentId,
  }: {
    commentId: EntityId;
  }): Promise<DBCommentRow | undefined> => {
    return withEnumRevival(
      database('comment')
        .select(...commentSelectColumns)
        .where('id', commentId)
        .first<DBCommentRow>(...commentSelectColumns),
      { targetType: CommentTargetType },
      { strict: true },
    );
  },
});
