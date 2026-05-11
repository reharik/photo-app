import { CommentTargetType } from '@packages/contracts';
import { publicResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const publicMediaItemResolvers: Resolvers = {
  PublicMediaItem: {
    comments: publicResolver(async (parent, args, ctx) => {
      const collectionInfo = args.input.collectionInfo;
      return ctx.agnosticReadServices.commentReadService.listComments({
        targetType: CommentTargetType.mediaItem,
        targetId: parent.id,
        collectionInfo,
      });
    }),
  },
};

export default publicMediaItemResolvers;
