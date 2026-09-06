import { EntityType, ReactionEmoji } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { EntityId } from '../../types/types';
import type { DbReactionRow, ReactionReadRepository, ReadRepositoryDeps } from './types';

export const build__ReactionReadRepository = ({
  uow,
}: ReadRepositoryDeps): ReactionReadRepository => ({
  countForTarget: async ({
    targetType,
    targetId,
  }: {
    targetType: EntityType;
    targetId: EntityId;
  }): Promise<number> => {
    await uow.join();
    const result = await uow
      .db()('reaction')
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
    targetType: EntityType;
    targetIds: EntityId[];
  }): Promise<DbReactionRow[]> => {
    if (targetIds.length === 0) {
      return [];
    }
    await uow.join();
    return withEnumRevival(
      uow
        .db()<DbReactionRow>('reaction')
        .select<DbReactionRow[]>()
        .where('user_id', viewerId)
        .where('target_type', targetType.value)
        .whereIn('target_id', targetIds),
      { emoji: ReactionEmoji },
    );
  },
});
