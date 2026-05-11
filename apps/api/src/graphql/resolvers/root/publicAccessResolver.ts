import { publicResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const publicAccessResolver: Pick<Resolvers, 'Query' | 'PublicAccess'> = {
  Query: {
    publicAccess: publicResolver(async (_, args, ctx) => {
      const publicLinkId = ctx.publicLinkId;
      if (!publicLinkId) {
        throw new Error('Public link id not found');
      }
      const publicAccess =
        await ctx.agnosticReadServices.publicAccessReadService.getPublicAccessById(publicLinkId);
      if (!publicAccess) {
        throw new Error('Public access not found');
      }
      return publicAccess;
    }),
  },
  PublicAccess: {
    album: publicResolver(async (publicAccess, args, ctx) => {
      const album = await ctx.publicReadServices.publicAlbumReadService.getAlbum(
        publicAccess.albumId,
      );
      if (!album) {
        throw new Error('Public album not found for provided access token');
      }
      return ctx.publicReadServices.applyPublicAuthorizationService.toAlbum(album);
    }),
    mediaItem: publicResolver(async (_, args, ctx) => {
      const mediaItem = await ctx.publicReadServices.publicMediaItemReadService.getPublicMediaItem({
        mediaItemId: args.id,
      });
      if (!mediaItem) {
        throw new Error('Public media item not found for provided access token');
      }
      return ctx.publicReadServices.applyPublicAuthorizationService.toPublicItem(mediaItem);
    }),
  },
};

export default publicAccessResolver;
