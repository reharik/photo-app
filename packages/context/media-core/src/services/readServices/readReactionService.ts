import { ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import { ReactionCounts, ViewerReaction } from '../..';
import { ReactionReadRepository } from '../../repositories';
import { EntityId } from '../../types';

type withAnemicReactions = {
  id: EntityId;
  reactionCounts: { total: number; byEmoji: { emoji: string; count: number }[] };
};
type WithReactions<T> = Omit<T, 'reactionCounts' | 'viewerReactions'> & {
  reactionCounts: ReactionCounts;
  viewerReactions: ViewerReaction[];
};

export interface ReadReactionService {
  withReactions: <T extends withAnemicReactions>(rows: T[]) => WithReactions<T>[];
  withViewerReactions: <T extends withAnemicReactions>(
    rows: T[],
    targetType: ReactionTargetType,
    viewerId: EntityId,
  ) => Promise<WithReactions<T>[]>;
}

export const build__ReadReactionService = ({
  reactionReadRepository,
}: {
  reactionReadRepository: ReactionReadRepository;
}): ReadReactionService => {
  const withReactions = <T extends withAnemicReactions>(rows: T[]): WithReactions<T>[] => {
    return rows.map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reactionCounts, ...rest } = r;
      return {
        ...rest,
        viewerReactions: [] as ViewerReaction[],
        reactionCounts: {
          total: r.reactionCounts.total ?? 0,
          byEmoji: (r.reactionCounts.byEmoji || []).map((e) => ({
            emoji: ReactionEmoji.fromValue(e.emoji),
            count: e.count,
          })),
        },
      };
      // TypeScript cannot verify spread-of-generic exhaustively; the cast is safe
      // because we construct exactly Omit<T, …> & { reactionCounts, viewerReactions }.
    }) as WithReactions<T>[];
  };
  const withViewerReactions = async <T extends withAnemicReactions>(
    rows: T[],
    targetType: ReactionTargetType,
    viewerId: EntityId,
  ): Promise<WithReactions<T>[]> => {
    const result = new Map<
      EntityId,
      { viewerReactions: ViewerReaction[]; reactionCounts: ReactionCounts }
    >();
    if (rows.length === 0) {
      return [];
    }
    const targetIds = rows.map((r) => r.id);
    const reactionRows = await reactionReadRepository.viewerReactionsForTargets({
      viewerId,
      targetType,
      targetIds,
    });

    for (const item of rows) {
      result.set(item.id, {
        viewerReactions: [],
        reactionCounts: {
          total: item.reactionCounts.total ?? 0,
          byEmoji: (item.reactionCounts.byEmoji || []).map((e) => ({
            emoji: ReactionEmoji.fromValue(e.emoji),
            count: e.count,
          })),
        },
      });
    }
    for (const row of reactionRows) {
      const counts = result.get(row.targetId)!;
      const list = counts.viewerReactions;
      list.push({ id: row.id, emoji: row.emoji });
    }
    return rows.map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reactionCounts, ...rest } = r;
      return { ...rest, ...result.get(r.id)! };
      // Same spread-of-generic limitation; cast is safe for the same reason as withReactions.
    }) as WithReactions<T>[];
  };

  return { withReactions, withViewerReactions };
};
