import { AppErrorCollection, ReactionTargetType } from '@packages/contracts';
import { Knex } from 'knex';
import { fail, ok } from '../../../domain';
import { CommentRepository, MediaItemRepository, ReactionRepository } from '../../../repositories';
import type { EntityId, WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type RemoveReactionCommand = {
  id: EntityId;
  targetType: ReactionTargetType;
  targetId: EntityId;
  viewer: { userId: EntityId };
};

export type RemoveReactionResult = { targetType: ReactionTargetType; targetId: EntityId };

export interface RemoveReaction extends WriteServiceBase {
  (command: RemoveReactionCommand): Promise<WriteResult<RemoveReactionResult>>;
}

type RemoveReactionDeps = {
  reactionRepository: ReactionRepository;
  mediaItemRepository: MediaItemRepository;
  commentRepository: CommentRepository;
  database: Knex;
};

export const build__RemoveReaction = ({
  reactionRepository,
  mediaItemRepository,
  commentRepository,
  database,
}: RemoveReactionDeps): RemoveReaction => {
  return async (command: RemoveReactionCommand): Promise<WriteResult<RemoveReactionResult>> => {
    const reaction = await reactionRepository.getById(command.id);
    if (!reaction) {
      return fail(AppErrorCollection.reaction.ReactionNotFound);
    }

    await reactionRepository.delete(reaction);

    await database.transaction(async (trx) => {
      await reactionRepository.delete(reaction, { trx });
      if (reaction.targetType() === ReactionTargetType.mediaItem) {
        await mediaItemRepository.decrementReactionCount(reaction.targetId(), reaction.emoji(), {
          trx,
        });
      } else if (reaction.targetType() === ReactionTargetType.comment) {
        await commentRepository.decrementReactionCount(reaction.targetId(), reaction.emoji(), {
          trx,
        });
      }
    });

    return ok({ targetType: reaction.targetType(), targetId: reaction.targetId() });
  };
};
