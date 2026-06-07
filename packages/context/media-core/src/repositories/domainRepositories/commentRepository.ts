import { CommentTargetType, ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { CommentRecord } from '../..';
import { Comment } from '../../domain/Comment/Comment';
import { RunInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';
import { ReactionRecord } from '../readRepositories/types';
import { persist } from './AggregateRepo';

export type CommentRepository = {
  getById: (id: EntityId, trx?: Knex.Transaction) => Promise<Comment | undefined>;
  save: (comment: Comment, trx: Knex.Transaction) => Promise<void>;
};

type CommentRepositoryDeps = { runInTransaction: RunInTransaction };

export const build__CommentRepository = ({
  runInTransaction,
}: CommentRepositoryDeps): CommentRepository => {
  const getById = async (id: EntityId, trx?: Knex.Transaction): Promise<Comment | undefined> => {
    return await runInTransaction(trx, async (db) => {
      const comment = await withEnumRevival(
        db<CommentRecord>('comment').where({ id }).first(),
        { targetType: CommentTargetType },
        { strict: true },
      );

      if (!comment) {
        return;
      }

      const reactionRows = await withEnumRevival(
        db<ReactionRecord>('reaction')
          .where({ targetId: id, targetType: ReactionTargetType.comment })
          .orderBy('createdAt', 'asc'),
        { emoji: ReactionEmoji, targetType: ReactionTargetType },
        { strict: true },
      );

      const childRecords = {
        reactions: reactionRows,
      };

      return Comment.rehydrate(comment, childRecords);
    });
  };

  const save = async (comment: Comment, trx: Knex.Transaction): Promise<void> => {
    await persist(trx, comment);
  };

  return {
    getById,
    save,
  };
};
