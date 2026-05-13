import { ReactionTargetType } from '@packages/contracts';
import type { Knex } from 'knex';
import type { ReactionReadRepository } from '../../../repositories/readRepositories/reactionReadRepository';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';

export type ReactionStateMap = Map<EntityId, { count: number; viewerHasReacted: boolean }>;

export interface viewerReactionReadService extends ReadServiceFactoryBase {
  getReactionStateForTargets: (args: {
    viewerUserId: EntityId | undefined;
    targetType: ReactionTargetType;
    targetIds: EntityId[];
  }) => Promise<ReactionStateMap>;

  viewerHasReactedBatch: (args: {
    viewerUserId: EntityId;
    targetType: ReactionTargetType;
    targetIds: EntityId[];
  }) => Promise<Map<EntityId, boolean>>;
}

type viewerReactionReadServiceDeps = {
  database: Knex;
  reactionReadRepository: ReactionReadRepository;
};

export const build__viewerReactionReadService = ({
  database,
  reactionReadRepository,
}: viewerReactionReadServiceDeps): viewerReactionReadService => ({
  getReactionStateForTargets: async ({
    viewerUserId,
    targetType,
    targetIds,
  }: {
    viewerUserId: EntityId | undefined;
    targetType: ReactionTargetType;
    targetIds: EntityId[];
  }): Promise<ReactionStateMap> => {
    const result: ReactionStateMap = new Map();
    if (targetIds.length === 0) {
      return result;
    }

    const table = targetType === ReactionTargetType.mediaItem ? 'media_item' : 'comment';
    const countRows = await database(table)
      .select<{ id: EntityId; reaction_count: number }[]>('id', 'reaction_count')
      .whereIn('id', targetIds);

    for (const row of countRows) {
      result.set(row.id, { count: row.reaction_count, viewerHasReacted: false });
    }

    if (viewerUserId) {
      const reactedMap = await reactionReadRepository.viewerReactionsForTargets({
        userId: viewerUserId,
        targetType,
        targetIds,
      });

      for (const [targetId, emojis] of reactedMap) {
        if (emojis.length > 0) {
          const existing = result.get(targetId);
          if (existing) {
            result.set(targetId, { ...existing, viewerHasReacted: true });
          }
        }
      }
    }

    return result;
  },

  viewerHasReactedBatch: async ({
    viewerUserId,
    targetType,
    targetIds,
  }: {
    viewerUserId: EntityId;
    targetType: ReactionTargetType;
    targetIds: EntityId[];
  }): Promise<Map<EntityId, boolean>> => {
    const result = new Map<EntityId, boolean>();
    for (const id of targetIds) {
      result.set(id, false);
    }

    if (targetIds.length === 0) {
      return result;
    }

    const reactedMap = await reactionReadRepository.viewerReactionsForTargets({
      userId: viewerUserId,
      targetType,
      targetIds,
    });

    for (const [targetId, emojis] of reactedMap) {
      if (emojis.length > 0) {
        result.set(targetId, true);
      }
    }

    return result;
  },
});
