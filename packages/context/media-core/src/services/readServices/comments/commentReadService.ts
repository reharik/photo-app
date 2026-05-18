import { CommentTargetType, ReactionTargetType } from '@packages/contracts';
import { groupByMapping } from '@packages/infrastructure';
import {
  CommentReadRepository,
  DBCommentRow,
} from '../../../repositories/readRepositories/commentReadRepository';
import { ReactionReadRepository } from '../../../repositories/readRepositories/reactionReadRepository';
import { EntityId, PageInfo } from '../../../types/types';
import { ReadReactionService } from '../readReactionService';
import { AgnosticReadServiceBase } from '../readServiceBaseType';
import { CommentGraph, CommentRow } from '../types';

export interface CommentReadService extends AgnosticReadServiceBase {
  listComments: (args: ListCommentsProps) => Promise<CommentRow[]>;
}

type CommentReadServiceDeps = {
  commentReadRepository: CommentReadRepository;
  readReactionService: ReadReactionService;
  reactionReadRepository: ReactionReadRepository;
};

type ListCommentsProps = {
  targetType: CommentTargetType;
  targetId: EntityId;
  collectionInfo: { pageInfo: PageInfo };
  viewerId?: EntityId;
};

export const build__CommentReadService = ({
  commentReadRepository,
  readReactionService,
  reactionReadRepository,
}: CommentReadServiceDeps): CommentReadService => {
  const enrichViewerComments = async (
    rows: DBCommentRow[],
    viewerId: EntityId,
  ): Promise<CommentRow[]> => {
    // Viewer Reactions
    const viewerReactionRows = await reactionReadRepository.viewerReactionsForTargets({
      viewerId,
      targetType: ReactionTargetType.mediaItem,
      targetIds: rows.map((r) => r.id),
    });
    const viewerReactionMap = groupByMapping(
      viewerReactionRows,
      (r) => r.targetId,
      (r) => ({ id: r.id, emoji: r.emoji }),
    );
    const reactionCounts = readReactionService.withReactions(rows);

    return rows.map((r) => ({
      ...r,
      reactionCounts: reactionCounts.get(r.id)?.reactionCounts ?? { total: 0, byEmoji: [] },
      viewerReactions: viewerReactionMap.get(r.id) ?? [],
    }));
  };

  const enrichComments = (rows: DBCommentRow[]): CommentRow[] => {
    const reactionMap = readReactionService.withReactions(rows);

    return rows.map((r) => ({
      ...r,
      reactionCounts: reactionMap.get(r.id)?.reactionCounts ?? { total: 0, byEmoji: [] },
      viewerReactions: [],
    }));
  };

  return {
    listComments: async ({
      targetType,
      targetId,
      collectionInfo,
      viewerId,
    }: ListCommentsProps): Promise<CommentRow[]> => {
      const nodes = await commentReadRepository.getCommentsForTarget({
        targetType,
        targetId,
        collectionInfo,
      });
      const enrichedNodes = viewerId
        ? await enrichViewerComments(nodes, viewerId)
        : enrichComments(nodes);

      const byId: Record<EntityId, CommentGraph> = {};
      for (const node of enrichedNodes) {
        byId[node.id] = { ...node, replies: [] };
      }

      // Pass 2: attach replies to parents, collect roots
      const roots: CommentGraph[] = [];
      for (const node of nodes) {
        const entry = byId[node.id];
        if (node.parentCommentId == null) {
          roots.push(entry);
        } else {
          byId[node.parentCommentId]?.replies.push(entry);
        }
      }

      // Sort
      const byCreatedAtAsc = (a: CommentRow, b: CommentRow) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

      for (const id in byId) {
        byId[id].replies.sort(byCreatedAtAsc);
      }
      roots.sort(byCreatedAtAsc);
      return roots;
    },
  };
};
