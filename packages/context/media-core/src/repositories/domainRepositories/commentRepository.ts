import { CommentTargetType } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { CommentRecord, DBReactionCounts } from '../..';
import { Comment } from '../../domain/Comment/Comment';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';

export type CommentRepository = {
  getById: (id: EntityId) => Promise<Comment | undefined>;
  save: (comment: Comment, trx: Knex.Transaction) => Promise<void>;
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

  const save = async (comment: Comment, trx: Knex.Transaction): Promise<void> => {
    await persist(trx, comment);
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
