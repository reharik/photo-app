import { hashToken } from '@packages/media-core';

import type { Maybe, Resolvers } from '../../generated/types.generated';

const publicAccessResolver: Pick<Resolvers, 'Query' | 'PublicAccess'> = {
  Query: {
    publicAccess: async (_p, { token }, ctx): Promise<Maybe<PublicAccess>> => {
      const tokenHash = hashToken(token);
      const publicAccess = await ctx.publicAccessReadRepository.findShareLinkByTokenHash(tokenHash);

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
