import { ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import type { EntityId } from '../../types/types';

export type ReactionReadRepository = {
  countForTarget: (args: { targetType: ReactionTargetType; targetId: EntityId }) => Promise<number>;
  viewerReactionsForTargets: (args: {
    viewerId: EntityId;
    targetType: ReactionTargetType;
    targetIds: EntityId[];
  }) => Promise<DbReactionRow[]>;
};

type ReactionReadRepositoryDeps = { database: Knex };

export type DbReactionRow = {
  id: EntityId;
  targetId: EntityId;
  emoji: ReactionEmoji;
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
    viewerId,
    targetType,
    targetIds,
  }: {
    viewerId: EntityId;
    targetType: ReactionTargetType;
    targetIds: EntityId[];
  }): Promise<DbReactionRow[]> => {
    if (targetIds.length === 0) {
      return [];
    }

    return withEnumRevival(
      database<DbReactionRow>('reaction')
        .select<DbReactionRow[]>()
        .where('user_id', viewerId)
        .where('target_type', targetType.value)
        .whereIn('target_id', targetIds),
      { reactionEmoji: ReactionEmoji },
      { strict: true },
    );
  },
});
