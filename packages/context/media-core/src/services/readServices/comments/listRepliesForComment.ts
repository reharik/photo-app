import { Knex } from 'knex';
import { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { CommentConnection } from './listCommentsForTarget';

export type ListRepliesForCommentArgs = {
  parentCommentId: EntityId;
  first?: number;
  after?: string;
};

export interface ListRepliesForCommentService {
  listReplies: (args: ListRepliesForCommentArgs) => Promise<CommentConnection>;
}

// QUESTION: Same dual-context concern as ListCommentsForTargetFactory — see
// listCommentsForTarget.ts for details. Currently only in readServiceFactories.
export interface ListRepliesForCommentFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): ListRepliesForCommentService;
}

type ListRepliesForCommentFactoryDeps = {
  database: Knex;
};

export const build__ListRepliesForCommentFactory = ({
  database,
}: ListRepliesForCommentFactoryDeps): ListRepliesForCommentFactory => {
  return (_args: { viewerId: string }): ListRepliesForCommentService => {
    return {
      listReplies: async (_args: ListRepliesForCommentArgs): Promise<CommentConnection> => {
        // TODO: Query the comment table WHERE parent_comment_id = args.parentCommentId
        //   AND deleted_at IS NULL.
        // TODO: Apply cursor-based pagination using args.first / args.after.
        // TODO: Return a CommentConnection with edges (cursor + node), pageInfo, totalCount.
        // NOTE: With the two-level cap enforced in addComment, replies of replies are
        //   rejected at write time, so this list will always be leaf comments.
        //   The resolver does NOT need to recurse.

        return {
          edges: [],
          pageInfo: { limit: 0, offset: 0 },
          totalCount: 0,
        };
      },
    };
  };
};
