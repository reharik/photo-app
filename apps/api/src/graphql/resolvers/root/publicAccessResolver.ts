import { hashToken } from '@packages/media-core';

import type { Resolvers } from '../../generated/types.generated';

const publicAccessResolver: Pick<Resolvers, 'Query' | 'PublicAccess'> = {
  Query: {
    publicAccess: async (_p, { token }, ctx) => {
      const tokenHash = hashToken(token);
      const publicAccess =
        await ctx.publicAccessReadRepository.findActiveWithGrantsByTokenHash(tokenHash);

      if (!publicAccess) {
        return undefined;
      }

      return {
        publicAccess,
      };
    },
  },
  PublicAccess: {
    publicAlbum: async (_parent, { id }, ctx) => {
      return await ctx.readServices.publicAlbumReadService.getAlbum(id);
    },
  },
};

export default publicAccessResolver;
