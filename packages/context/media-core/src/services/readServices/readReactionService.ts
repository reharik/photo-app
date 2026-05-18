import { ReactionEmoji } from '@packages/contracts';
import { ReactionCounts } from '../..';
import { EntityId } from '../../types';

export type WithAnemicReactions = {
  id: EntityId;
  reactionCounts: { total: number; byEmoji: { emoji: string; count: number }[] };
};
export interface ReadReactionService {
  withReactions: (rows: WithAnemicReactions[]) => Map<EntityId, { reactionCounts: ReactionCounts }>;
}

export const build__ReadReactionService = (): ReadReactionService => {
  const withReactions = (
    rows: WithAnemicReactions[],
  ): Map<EntityId, { reactionCounts: ReactionCounts }> => {
    const result = new Map<EntityId, { reactionCounts: ReactionCounts }>();
    if (rows.length === 0) {
      return result;
    }
    for (const item of rows) {
      const reactionCounts = {
        total: item.reactionCounts.total ?? 0,
        byEmoji: (item.reactionCounts.byEmoji || []).map((e) => ({
          emoji: ReactionEmoji.fromValue(e.emoji),
          count: e.count,
        })),
      };
      result.set(item.id, {
        reactionCounts,
      });
    }
    return result;
  };
  return { withReactions };
};
