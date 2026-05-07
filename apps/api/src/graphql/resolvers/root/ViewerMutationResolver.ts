import { authenticatedResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';

const viewerResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    createAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.createAlbum({
        viewerId: ctx.viewer.id,
        title: args.input.title,
        description: args.input.description,
      });

      return {
        data: result.success ? { albumId: result.value.albumId } : undefined,
        errors: result.success ? [] : [toContractErrorPayload(result.error)],
      };
    }),

    deleteAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.deleteAlbum({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
      });

      return {
        data: result.success
          ? {
              albumId: result.value.albumId,
            }
          : undefined,
        errors: result.success ? [] : [toContractErrorPayload(result.error)],
      };
    }),
  },
};

export default viewerResolvers;
