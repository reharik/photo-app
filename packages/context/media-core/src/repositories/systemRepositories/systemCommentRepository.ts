import { Knex } from 'knex';
import { CommentRecord } from '../../domain';
import { EntityId } from '../../types';

export type SystemCommentRepository = {
  getCommentById: (commentId: EntityId) => Promise<CommentRecord>;
  getCommentsByIds: (commentIds: EntityId[]) => Promise<CommentRecord[]>;
};

type systemCommentRepositoryDeps = {
  database: Knex;
};

export const build__systemCommentRepository = ({
  database,
}: systemCommentRepositoryDeps): SystemCommentRepository => ({
  getCommentById: async (commentId: EntityId) => {
    return database('comment').where({ id: commentId }).first<CommentRecord>();
  },
  getCommentsByIds: async (commentIds: EntityId[]) => {
    return database('comment').whereIn('id', commentIds).select<CommentRecord[]>();
  },
});
