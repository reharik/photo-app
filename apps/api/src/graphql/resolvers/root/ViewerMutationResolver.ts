import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';
import { writeResultToPayload } from '../../util/writeResultToPayload';

const viewerMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    deleteAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
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
      const result = await ctx.writeServices.deleteShareContactService(handle, ctx.viewer.id);
      return writeResultToPayload(result);
    }),
  },
};
export default viewerMutationResolvers;
