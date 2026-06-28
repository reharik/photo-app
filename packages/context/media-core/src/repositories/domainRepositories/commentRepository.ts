import { EntityType, ReactionEmoji } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { CommentRecord, RequestScopeLifeCycle, UnitOfWork } from '../..';
import { Comment } from '../../domain/Comment/Comment';
import type { EntityId } from '../../types/types';
import { ReactionRecord } from '../readRepositories/types';
import { persist } from './AggregateRepo';

export interface CommentRepository extends RequestScopeLifeCycle {
  getById: (id: EntityId) => Promise<Comment | undefined>;
  save: (comment: Comment) => Promise<void>;
}

type CommentRepositoryDeps = { uow: UnitOfWork };

export const build__CommentRepository = ({ uow }: CommentRepositoryDeps): CommentRepository => {
  const getById = async (id: EntityId): Promise<Comment | undefined> => {
    const comment = await withEnumRevival(
      uow.db()<CommentRecord>('comment').where({ id }).first(),
      { targetType: EntityType },
      { strict: true },
    );

    if (!comment) {
      return;
    }

    const reactionRows = await withEnumRevival(
      uow
        .db()<ReactionRecord>('reaction')
        .where({ targetId: id, targetType: EntityType.comment })
        .orderBy('createdAt', 'asc'),
      { emoji: ReactionEmoji, targetType: EntityType },
      { strict: true },
    );

    const childRecords = {
      reactions: reactionRows,
    };

    return Comment.rehydrate(comment, childRecords);
  };

  const save = async (comment: Comment): Promise<void> => {
    await persist(comment, uow);
  };

  return {
    getById,
    save,
  };
};
