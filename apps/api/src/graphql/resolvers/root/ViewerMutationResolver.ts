import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const viewerMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    deleteAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
      return ctx.writeServices.deleteAlbum({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
      });
    }),

    markSurfaceSeen: authenticatedWriteResolver(
      async (_parent, { targetType, targetId, kind }, ctx) => {
        return ctx.writeServices.markActivitySeen.clearBySurface({
          viewerId: ctx.viewer.id,
          targetType,
          targetId,
          kind,
        });
      },
    ),

    markItemsSeen: authenticatedWriteResolver(async (_parent, { ids }, ctx) => {
      return ctx.writeServices.markActivitySeen.clearByIds({ viewerId: ctx.viewer.id, ids });
    }),

    deleteShareContact: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const { handle } = args;
      return ctx.writeServices.deleteShareContactService(handle, ctx.viewer.id);
    }),
  },
};
export default viewerMutationResolvers;
