import { CommentTargetType } from '@packages/media-core';
import { authenticatedResolver, publicResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const EDITED_GRACE_WINDOW_MS = 5_000;

const commentFieldResolvers: Resolvers = {
  MediaItem: {
    comments: authenticatedResolver(async (parent, args, ctx) => {
      return ctx.readServices.listCommentsForTarget.listComments({
        targetType: CommentTargetType.MEDIA_ITEM,
        targetId: parent.id,
        first: args.first ?? undefined,
        after: args.after ?? undefined,
      });
    }),
  },

  Album: {
    comments: authenticatedResolver(async (parent, args, ctx) => {
      return ctx.readServices.listCommentsForTarget.listComments({
        targetType: CommentTargetType.ALBUM,
        targetId: parent.id,
        first: args.first ?? undefined,
        after: args.after ?? undefined,
      });
    }),
  },

  // QUESTION: PublicMediaItem and PublicAlbum resolvers run under PublicGraphQLContext,
  // which only has publicReadServices. listCommentsForTargetFactory currently implements
  // ReadServiceFactoryBase, so it lives in readServiceFactories and is NOT accessible via
  // ctx.publicReadServices. To fix this, either:
  //   a) Have ListCommentsForTargetFactory also implement PublicReadServiceFactoryBase so
  //      gen:container places it in both groups.
  //   b) Create a separate publicListCommentsForTargetFactory.ts (PublicReadServiceFactoryBase).
  //   c) Wire the service as a standalone singleton (like publicAccessReadService) and
  //      expose it on both context types via createGraphQLContext.ts + types.ts.
  // For now these resolvers are stubs that return an empty connection via the database.
  // Real implementation should use the same listCommentsForTarget service as the viewer path.

  PublicMediaItem: {
    comments: publicResolver(async (parent, args, _ctx) => {
      // TODO: Replace with ctx.publicReadServices.listCommentsForTarget once the service
      //   is registered in the publicReadServiceFactories group (see QUESTION above).
      return {
        edges: [],
        pageInfo: { limit: args.first ?? 0, offset: 0 },
        totalCount: 0,
      };
    }),
  },

  PublicAlbum: {
    comments: publicResolver(async (parent, args, _ctx) => {
      // TODO: Replace with ctx.publicReadServices.listCommentsForTarget once the service
      //   is registered in the publicReadServiceFactories group (see QUESTION above).
      return {
        edges: [],
        pageInfo: { limit: args.first ?? 0, offset: 0 },
        totalCount: 0,
      };
    }),
  },

  Comment: {
    isEdited: (parent) => {
      const created = new Date(parent.createdAt).getTime();
      const updated = new Date(parent.updatedAt).getTime();
      return updated - created > EDITED_GRACE_WINDOW_MS;
    },

    isDeleted: (parent) => {
      return parent.deletedAt != null;
    },

    replies: authenticatedResolver(async (parent, args, ctx) => {
      return ctx.readServices.listRepliesForComment.listReplies({
        parentCommentId: parent.id,
        first: args.first ?? undefined,
        after: args.after ?? undefined,
      });
    }),
  },
};

export default commentFieldResolvers;
