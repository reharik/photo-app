import { ReactionTargetType } from '@packages/contracts';
import type { Knex } from 'knex';
import type { EntityId } from '../../types/types';

export type ReactionReadRepository = {
  countForTarget: (args: { targetType: ReactionTargetType; targetId: EntityId }) => Promise<number>;
  viewerReactionsForTargets: (args: {
    userId: EntityId;
    targetType: ReactionTargetType;
    targetIds: EntityId[];
  }) => Promise<Map<EntityId, string[]>>;
};

type ReactionReadRepositoryDeps = { database: Knex };

type DbReactionRow = {
  target_id: EntityId;
  emoji: string;
};

export const build__ReactionReadRepository = ({
  database,
}: ReactionReadRepositoryDeps): ReactionReadRepository => ({
  countForTarget: async ({
    targetType,
    targetId,
  }: {
    targetType: ReactionTargetType;
    targetId: EntityId;
  }): Promise<number> => {
    const result = await database('reaction')
      .where({
        target_type: targetType,
        target_id: targetId,
      })
      .count<{ count: string }>('* as count')
      .first();
    return result ? parseInt(result.count, 10) : 0;
  },

  viewerReactionsForTargets: async ({
    userId,
    targetType,
    targetIds,
  }: {
    userId: EntityId;
    targetType: ReactionTargetType;
    targetIds: EntityId[];
  }): Promise<Map<EntityId, string[]>> => {
    const result = new Map<EntityId, string[]>();
    for (const id of targetIds) {
      result.set(id, []);
    }

    if (targetIds.length === 0) {
      return result;
    }

    const rows = await database('reaction')
      .select<Pick<DbReactionRow, 'target_id' | 'emoji'>[]>('target_id', 'emoji')
      .where('user_id', userId)
      .where('target_type', targetType)
      .whereIn('target_id', targetIds);

    for (const row of rows) {
      const list = result.get(row.target_id);
      if (list) {
        list.push(row.emoji);
      }
    }

    return result;
  },
});
