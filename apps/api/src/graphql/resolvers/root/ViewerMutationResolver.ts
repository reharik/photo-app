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
    markSeen: authenticatedWriteResolver((_parent, args, ctx) => {
      const { targetType, targetId } = args;
      return ctx.writeServices.markActivitySeen({
        targetType,
        targetId,
        viewerId: ctx.viewer.id,
      });
    }),
    deleteShareContact: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const { handle } = args;
      return ctx.writeServices.deleteShareContactService(handle, ctx.viewer.id);
    }),
  },
};
export default viewerMutationResolvers;
