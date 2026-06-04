import { AppErrorCollection, ReactionTargetType } from '@packages/contracts';
import { Knex } from 'knex';
import { fail, ok } from '../../../domain';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import {
  CommentReadRepository,
  CommentRepository,
  MediaItemReadRepository,
  MediaItemRepository,
  ReactionRepository,
} from '../../../repositories';
import type { EntityId, WriteResult } from '../../../types/types';
import { DBReactionCounts } from '../../readServices/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type RemoveReactionCommand = {
  id: EntityId;
  targetType: ReactionTargetType;
  targetId: EntityId;
  viewer: { userId: EntityId };
};

export type RemoveReactionResult = { targetType: ReactionTargetType; targetId: EntityId };

export interface RemoveReaction extends WriteServiceBase {
  (
    command: RemoveReactionCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<RemoveReactionResult>>;
}

type RemoveReactionDeps = {
  reactionRepository: ReactionRepository;
  mediaItemRepository: MediaItemRepository;
  commentRepository: CommentRepository;
  mediaItemReadRepository: MediaItemReadRepository;
  commentReadRepository: CommentReadRepository;
  runInTransaction: RunInTransaction;
};

export const build__RemoveReaction = ({
  reactionRepository,
  mediaItemRepository,
  mediaItemReadRepository,
  commentReadRepository,
  commentRepository,
  runInTransaction,
}: RemoveReactionDeps): RemoveReaction => {
  return async (
    command: RemoveReactionCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<RemoveReactionResult>> => {
    const reaction = await reactionRepository.getById(command.id);
    if (!reaction) {
      return fail(AppErrorCollection.reaction.ReactionNotFound);
    }

    let updatedReactionCount: DBReactionCounts;
    if (reaction.targetType().equals(ReactionTargetType.mediaItem)) {
      const mediaItem = await mediaItemReadRepository.getByIdForAuthorization({
        mediaItemId: reaction.targetId(),
      });
      if (!mediaItem) {
        return fail(AppErrorCollection.reaction.ReactionTargetNotFound);
      }
      updatedReactionCount = mediaItem.reactionCounts;
    } else {
      const comment = await commentReadRepository.getByIdForAuthorization({
        commentId: reaction.targetId(),
      });
      if (!comment) {
        return fail(AppErrorCollection.reaction.ReactionTargetNotFound);
      }
      updatedReactionCount = comment.reactionCounts;
    }
    updatedReactionCount.total--;
    const existingCount = updatedReactionCount.byEmoji?.find(
      (e) => e.emoji === reaction.emoji().value,
    );
    if (existingCount) {
      existingCount.count--;
    }

    await runInTransaction(trx, async (db) => {
      await reactionRepository.delete(reaction, db);
      if (reaction.targetType().equals(ReactionTargetType.mediaItem)) {
        await mediaItemRepository.updateReactionCounts(
          reaction.targetId(),
          updatedReactionCount,
          db,
        );
      } else if (reaction.targetType().equals(ReactionTargetType.comment)) {
        await commentRepository.updateReactionCounts(reaction.targetId(), updatedReactionCount, db);
      }
    });

    return ok({ targetType: reaction.targetType(), targetId: reaction.targetId() });
  };
};
