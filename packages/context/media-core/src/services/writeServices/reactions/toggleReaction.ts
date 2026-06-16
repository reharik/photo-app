import {
  AppErrorCollection,
  fail,
  ok,
  ReactionEmoji,
  ReactionTargetType,
  User,
  WriteResult,
} from '@packages/contracts';
import { Knex } from 'knex';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import type { CommentRepository } from '../../../repositories/domainRepositories/commentRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import type { EntityId } from '../../../types/types';
import { Reaction } from '../mediaItem/writeMediaItem.types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type ToggleReactionCommand = {
  targetType: ReactionTargetType;
  targetId: EntityId;
  emoji: ReactionEmoji;
  viewer: User;
};

export type ToggleReactionResult = { targetType: ReactionTargetType; targetId: EntityId };

export interface ToggleReaction extends WriteServiceBase {
  (
    command: ToggleReactionCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<ToggleReactionResult>>;
}

type ToggleReactionDeps = {
  commentRepository: CommentRepository;
  mediaItemRepository: MediaItemRepository;
  runInTransaction: RunInTransaction;
};

export const build__ToggleReaction = ({
  commentRepository,
  runInTransaction,
  mediaItemRepository,
}: ToggleReactionDeps): ToggleReaction => {
  return async (
    command: ToggleReactionCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<ToggleReactionResult>> => {
    const { targetType, targetId, emoji, viewer } = command;
    const newReaction: Reaction = {
      id: crypto.randomUUID(),
      targetType,
      targetId,
      emoji,
      firstName: viewer.firstName,
      lastName: viewer.lastName,
      userId: viewer.id,
      createdBy: viewer.id,
      createdAt: new Date(),
      updatedBy: viewer.id,
      updatedAt: new Date(),
    };
    if (targetType.equals(ReactionTargetType.mediaItem)) {
      const mediaItem = await mediaItemRepository.getById(targetId);
      if (!mediaItem) {
        return fail(AppErrorCollection.reaction.ReactionTargetNotFound);
      }
      mediaItem.toggleReaction(newReaction, viewer.id);
      await runInTransaction(trx, async (db) => {
        await mediaItemRepository.save(mediaItem, db);
      });
    } else {
      const comment = await commentRepository.getById(targetId);
      if (!comment) {
        return fail(AppErrorCollection.reaction.ReactionTargetNotFound);
      }
      comment.toggleReaction(newReaction, viewer.id);
      await runInTransaction(trx, async (db) => {
        await commentRepository.save(comment, db);
      });
    }

    return ok({ targetType, targetId });
  };
};
