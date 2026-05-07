import { publicResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const publicAccessResolver: Pick<Resolvers, 'Query' | 'PublicAccess'> = {
  Query: {
    publicAccess: publicResolver((_, args, ctx) => {
      return ctx.publicAccess;
    }),
  },
  PublicAccess: {
    album: publicResolver(async (_, { albumId }, ctx) => {
      const album = await ctx.publicReadServices.publicAlbumReadService.getAlbum(albumId);
      if (!album) {
        throw new Error('Public album not found for provided access token');
      }
      return ctx.publicReadServices.applyPublicAuthorizationService.toAlbum(album);
    }),
  },
};

export default publicAccessResolver;
