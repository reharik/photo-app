import { CommentTargetType } from '@packages/contracts';
import { Knex } from 'knex';
import { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';

export type CommentRow = {
  id: EntityId;
  targetType: CommentTargetType;
  targetId: EntityId;
  parentCommentId: EntityId | null;
  authorUserId: EntityId | null;
  body: string;
  displayName: string;
  displayAvatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CommentEdge = {
  cursor: string;
  node: CommentRow;
};

export type CommentConnection = {
  edges: CommentEdge[];
  pageInfo: { limit: number; offset: number };
  totalCount: number;
};

export type ListCommentsForTargetArgs = {
  targetType: CommentTargetType;
  targetId: EntityId;
  first?: number;
  after?: string;
};

export interface ListCommentsForTargetService {
  listComments: (args: ListCommentsForTargetArgs) => Promise<CommentConnection>;
}

// QUESTION: This service is used from both authenticated (ctx.readServices) and public
// (ctx.publicReadServices) field resolvers. ReadServiceFactoryBase only places it in
// readServiceFactories, meaning public-path resolvers cannot access it via
// ctx.publicReadServices. Options:
//   1. Also implement PublicReadServiceFactoryBase so gen:container adds it to both groups.
//   2. Create a separate public wrapper file (publicListCommentsForTarget.ts).
//   3. Wire it as a standalone singleton (like publicAccessReadService) directly into the context.
// Resolving this requires understanding how ioc-manifest handles dual interface membership.
// For now this implements ReadServiceFactoryBase only; public field resolvers note the gap.
export interface ListCommentsForTargetFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): ListCommentsForTargetService;
}

type ListCommentsForTargetFactoryDeps = {
  database: Knex;
};

export const build__ListCommentsForTargetFactory = ({
  database,
}: ListCommentsForTargetFactoryDeps): ListCommentsForTargetFactory => {
  return (_args: { viewerId: string }): ListCommentsForTargetService => {
    return {
      listComments: async (_args: ListCommentsForTargetArgs): Promise<CommentConnection> => {
        // TODO: Query the comment table WHERE target_type = args.targetType
        //   AND target_id = args.targetId AND parent_comment_id IS NULL
        //   (top-level comments only) AND deleted_at IS NULL.
        // TODO: Apply cursor-based pagination using args.first / args.after.
        // TODO: Return a CommentConnection with edges (cursor + node), pageInfo, totalCount.

        return {
          edges: [],
          pageInfo: { limit: 0, offset: 0 },
          totalCount: 0,
        };
      },
    };
  };
};
