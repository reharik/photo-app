import { AppErrorCollection, ReactionTargetType } from '@packages/contracts';
import { Knex } from 'knex';
import { fail, ok } from '../../../domain';
import { Reaction } from '../../../domain/Reaction/Reaction';
import type { CommentRepository } from '../../../repositories/domainRepositories/commentRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { ReactionRepository } from '../../../repositories/domainRepositories/reactionRepository';
import type { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import type { EntityId, WriteResult } from '../../../types/types';
import type { ValidateViewerOperationService } from '../../readServices/mediaGrantService';
import { WriteServiceBase } from '../writeServiceBaseType';

export type AddReactionCommand = {
  targetType: ReactionTargetType;
  targetId: EntityId;
  emoji: string;
  viewer: { userId: EntityId };
};

export type AddReactionResult = { targetType: ReactionTargetType; targetId: EntityId };

export interface AddReaction extends WriteServiceBase {
  (command: AddReactionCommand): Promise<WriteResult<AddReactionResult>>;
}

type AddReactionDeps = {
  mediaItemReadRepository: MediaItemReadRepository;
  commentRepository: CommentRepository;
  validateViewerOperationService: ValidateViewerOperationService;
  reactionRepository: ReactionRepository;
  mediaItemRepository: MediaItemRepository;
  database: Knex;
};

export const build__AddReaction = ({
  mediaItemReadRepository,
  commentRepository,
  database,
  reactionRepository,
  mediaItemRepository,
}: AddReactionDeps): AddReaction => {
  return async (command: AddReactionCommand): Promise<WriteResult<AddReactionResult>> => {
    const { targetType, targetId, emoji, viewer } = command;

    if (targetType === ReactionTargetType.mediaItem) {
      const mediaItem = await mediaItemReadRepository.getByIdForAuthorization({
        mediaItemId: targetId,
      });
      if (!mediaItem) {
        return fail(AppErrorCollection.reaction.ReactionTargetNotFound);
      }
    } else {
      const comment = await commentRepository.getById(targetId);
      if (!comment) {
        return fail(AppErrorCollection.reaction.ReactionTargetNotFound);
      }
    }

    const reaction = Reaction.create({ targetType, targetId, userId: viewer.userId, emoji });
    await database.transaction(async (trx) => {
      await reactionRepository.save(reaction, { trx });
      if (targetType === ReactionTargetType.mediaItem) {
        await mediaItemRepository.incrementReactionCount(targetId, emoji, { trx });
      } else if (targetType === ReactionTargetType.comment) {
        await commentRepository.incrementReactionCount(targetId, emoji, { trx });
      }
    });

    return ok({ targetType, targetId });
  };
};
