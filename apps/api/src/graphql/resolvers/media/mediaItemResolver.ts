import { authenticatedResolver } from '../../context/authenticatedContext';
import type { Resolvers } from '../../generated/types.generated';

const mediaItemResolvers: Resolvers = {
  MediaItem: {
    authorizations: authenticatedResolver(async (parent, _args, ctx) => {
      return ctx.readServices.viewerAlbumAuthzReadService.getMediaItemAuthorizations({
        mediaItemId: parent.id,
      });
    }),
  },
};

export default mediaItemResolvers;
