import { CommentTargetType } from '@packages/contracts';
import { publicResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const EDIT_GRACE_WINDOW_MS = 5000;

const publicMediaItemResolvers: Resolvers = {
  PublicMediaItem: {
    comments: publicResolver(async (parent, args, ctx) => {
      const collectionInfo = args.input.collectionInfo;
      const comments = await ctx.agnosticReadServices.commentReadService.listComments({
        targetType: CommentTargetType.mediaItem,
        targetId: parent.id,
        collectionInfo,
      });
      const totalCount = comments.length > 0 ? comments[0].totalCount : 0;
      return {
        nodes: comments,
        pageInfo: collectionInfo.pageInfo,
        totalCount,
      };
    }),
  },
  Comment: {
    isEdited: (parent) => {
      return parent.updatedAt.getTime() > parent.createdAt.getTime() + EDIT_GRACE_WINDOW_MS;
    },
    isDeleted: (parent) => {
      return parent.deletedAt != null;
    },
  },
};

export default publicMediaItemResolvers;
