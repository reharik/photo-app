import { CommentTargetType } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { CommentRecord, DBReactionCounts, ok } from '../..';
import { Comment } from '../../domain/Comment/Comment';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId, WriteResult } from '../../types/types';

export type CommentRepository = {
  getById: (id: EntityId) => Promise<Comment | undefined>;
  save: (comment: Comment, options?: RepoOptions) => Promise<WriteResult<void>>;
  updateReactionCounts(
    commentId: EntityId,
    reactionCounts: DBReactionCounts,
    options?: RepoOptions,
  ): Promise<void>;
};

type CommentRepositoryDeps = { database: Knex };

export const build__CommentRepository = ({
  database,
}: CommentRepositoryDeps): CommentRepository => {
  const getById = async (id: EntityId): Promise<Comment | undefined> => {
    const row = await withEnumRevival(
      database<CommentRecord>('comment').where({ id }).first(),
      { targetType: CommentTargetType },
      { strict: true },
    );

    if (!row) {
      return;
    }

    return Comment.rehydrate(row);
  };

  const save = async (comment: Comment, options?: RepoOptions): Promise<WriteResult<void>> => {
    await runInTransaction(database, options, async (trx) => {
      const record = comment.toPersistence();

      const existing = await trx<CommentRecord>('comment').where({ id: record.id }).first();

      if (existing) {
        await trx<CommentRecord>('comment').where({ id: record.id }).update(record);
      } else {
        await trx<CommentRecord>('comment').insert(record);
      }
    });
    return ok(undefined);
  };

  const updateReactionCounts = async (
    commentId: EntityId,
    reactionCounts: DBReactionCounts,
    options?: RepoOptions,
  ): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      await trx('comment').where({ id: commentId }).update({ reactionCounts });
    });
  };

  return {
    getById,
    save,
    updateReactionCounts,
  };
};
