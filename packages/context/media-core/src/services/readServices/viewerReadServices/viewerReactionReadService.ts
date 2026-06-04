import { ReactionTargetType } from '@packages/contracts';
import type { Knex } from 'knex';

import type { ReactionReadRepository } from '../../../repositories/readRepositories/types';
import type { EntityId } from '../../../types/types';
import { ReadServiceBase } from '../readServiceBaseType';
import { ViewerReaction } from '../types';

export interface viewerReactionReadService extends ReadServiceBase {
  getReactionStateForTargets: (args: {
    targetType: ReactionTargetType;
    targetIds: EntityId[];
  }) => Promise<Map<EntityId, ViewerReaction[]>>;
}

type ViewerReactionReadServiceDeps = {
  database: Knex;
  reactionReadRepository: ReactionReadRepository;
  viewerId: string;
};

export const build__viewerReactionReadService = ({
  reactionReadRepository,
  viewerId,
}: ViewerReactionReadServiceDeps): viewerReactionReadService => {
  return {
    getReactionStateForTargets: async ({
      targetType,
      targetIds,
    }: {
      targetType: ReactionTargetType;
      targetIds: EntityId[];
    }): Promise<Map<EntityId, ViewerReaction[]>> => {
      const result = new Map<EntityId, ViewerReaction[]>();
      if (targetIds.length === 0) {
        return result;
      }
      const rows = await reactionReadRepository.viewerReactionsForTargets({
        viewerId,
        targetType,
        targetIds,
      });

      for (const id of targetIds) {
        result.set(id, []);
      }
      for (const row of rows) {
        const list = result.get(row.targetId)!;
        list.push({ id: row.id, emoji: row.emoji });
      }
      return result;
    },
  };
};
