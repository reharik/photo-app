import { AppErrorCollection, ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import { Knex } from 'knex';
import { fail, ok } from '../../../domain';
import { Reaction } from '../../../domain/Reaction/Reaction';
import { CommentReadRepository } from '../../../repositories';
import type { CommentRepository } from '../../../repositories/domainRepositories/commentRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { ReactionRepository } from '../../../repositories/domainRepositories/reactionRepository';
import type { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import type { EntityId, WriteResult } from '../../../types/types';
import type { ValidateViewerOperationService } from '../../readServices/mediaGrantService';
import { DBReactionCounts } from '../../readServices/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type AddReactionCommand = {
  targetType: ReactionTargetType;
  targetId: EntityId;
  emoji: ReactionEmoji;
  viewer: { userId: EntityId };
};

export type AddReactionResult = { targetType: ReactionTargetType; targetId: EntityId };

export interface AddReaction extends WriteServiceBase {
  (command: AddReactionCommand): Promise<WriteResult<AddReactionResult>>;
}

type AddReactionDeps = {
  mediaItemReadRepository: MediaItemReadRepository;
  commentReadRepository: CommentReadRepository;
  commentRepository: CommentRepository;
  validateViewerOperationService: ValidateViewerOperationService;
  reactionRepository: ReactionRepository;
  mediaItemRepository: MediaItemRepository;
  database: Knex;
};

export const build__AddReaction = ({
  mediaItemReadRepository,
  commentReadRepository,
  commentRepository,
  database,
  reactionRepository,
  mediaItemRepository,
}: AddReactionDeps): AddReaction => {
  return async (command: AddReactionCommand): Promise<WriteResult<AddReactionResult>> => {
    const { targetType, targetId, emoji, viewer } = command;

    let updatedReactionCount: DBReactionCounts;
    if (targetType === ReactionTargetType.mediaItem) {
      const mediaItem = await mediaItemReadRepository.getByIdForAuthorization({
        mediaItemId: targetId,
      });
      if (!mediaItem) {
        return fail(AppErrorCollection.reaction.ReactionTargetNotFound);
      }
      updatedReactionCount = mediaItem.reactionCounts;
    } else {
      const comment = await commentReadRepository.getByIdForAuthorization({
        commentId: targetId,
      });
      if (!comment) {
        return fail(AppErrorCollection.reaction.ReactionTargetNotFound);
      }
      updatedReactionCount = comment.reactionCounts;
    }
    updatedReactionCount.total = (updatedReactionCount.total ?? 0) + 1;
    const existingCount = updatedReactionCount.byEmoji?.find((e) => e.emoji === emoji.value);
    if (existingCount) {
      existingCount.count++;
    } else if (updatedReactionCount.byEmoji) {
      updatedReactionCount.byEmoji?.push({ emoji: emoji.value, count: 1 });
    } else {
      updatedReactionCount.byEmoji = [{ emoji: emoji.value, count: 1 }];
    }

    const reaction = Reaction.create({ targetType, targetId, userId: viewer.userId, emoji });
    await database.transaction(async (trx) => {
      await reactionRepository.save(reaction, { trx });
      if (targetType === ReactionTargetType.mediaItem) {
        await mediaItemRepository.updateReactionCounts(targetId, updatedReactionCount, { trx });
      } else if (targetType === ReactionTargetType.comment) {
        await commentRepository.updateReactionCounts(targetId, updatedReactionCount, { trx });
      }
    });

    return ok({ targetType, targetId });
  };
};
