import { CommentTargetType } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { CommentRecord, DBReactionCounts } from '../..';
import { Comment } from '../../domain/Comment/Comment';
import { RunInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';

export type CommentRepository = {
  getById: (id: EntityId, trx?: Knex.Transaction) => Promise<Comment | undefined>;
  save: (comment: Comment, trx: Knex.Transaction) => Promise<void>;
  updateReactionCounts(
    commentId: EntityId,
    reactionCounts: DBReactionCounts,
    trx: Knex.Transaction,
  ): Promise<void>;
};

type CommentRepositoryDeps = { runInTransaction: RunInTransaction };

export const build__CommentRepository = ({
  runInTransaction,
}: CommentRepositoryDeps): CommentRepository => {
  const getById = async (id: EntityId, trx?: Knex.Transaction): Promise<Comment | undefined> => {
    const row = await runInTransaction(
      trx,
      async (db) =>
        await withEnumRevival(
          db<CommentRecord>('comment').where({ id }).first(),
          { targetType: CommentTargetType },
          { strict: true },
        ),
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
    trx: Knex.Transaction,
  ): Promise<void> => {
    await trx('comment').where({ id: commentId }).update({ reactionCounts });
  };

  return {
    getById,
    save,
    updateReactionCounts,
  };
};
