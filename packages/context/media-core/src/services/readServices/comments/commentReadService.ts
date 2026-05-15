import { CommentTargetType, ReactionTargetType } from '@packages/contracts';
import { CommentReadRepository } from '../../../repositories/readRepositories/commentReadRepository';
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
}: CommentReadServiceDeps): CommentReadService => {
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
        ? await readReactionService.withViewerReactions(nodes, ReactionTargetType.comment, viewerId)
        : readReactionService.withReactions(nodes);

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
