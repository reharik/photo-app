import { authenticatedResolver } from '../../context/authenticatedContext';
import type { Resolvers } from '../../generated/types.generated';

const mediaItemResolvers: Resolvers = {
  MediaItem: {
    shares: authenticatedResolver(async (parent, _args, ctx) => {
      return ctx.readServices.viewerShareReadService.getMediaItemShares({
        mediaItemId: parent.id,
      });
    }),
  },
};

export default mediaItemResolvers;
