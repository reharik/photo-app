import { ContractError, fail, ok } from '@packages/contracts';
import { GrantUserAuthorizationCommand } from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const authorizationMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    grantUserAuthorizationsForMediaItems: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationCommand = {
        viewerId: ctx.viewer.id,
        viewerFirstName: ctx.viewer.firstName,
        viewerLastName: ctx.viewer.lastName,
        entityIds: args.input.mediaItemIds,
        grantedToHandles: args.input.grantedToHandles,
        label: args.input.label ?? undefined,
      };
      const result = await ctx.writeServices.grantUserAuthorization(command, true);
      if (!result.success) {
        return result;
      }
      if (result.value.failed.length > 0) {
        return fail(ContractError.PartialShareFailure);
      }
      return ok({ userIds: result.value.succeeded.map((x) => x.item.id()) });
    }),

    grantUserAuthorizationForAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationCommand = {
        viewerId: ctx.viewer.id,
        viewerFirstName: ctx.viewer.firstName,
        viewerLastName: ctx.viewer.lastName,
        entityIds: [args.input.albumId],
        grantedToHandles: args.input.grantedToHandles,
        label: args.input.label ?? undefined,
      };
      const result = await ctx.writeServices.grantUserAuthorization(command, false);
      if (!result.success) {
        return result;
      }

      return ok({
        succeeded: result.value.succeeded.map((x) => ({ email: x.item.email() })),
        failed: result.value.failed.map((x) => ({ email: x.item.email(), error: x.error })),
      });
    }),
  },
};

export default authorizationMutationResolvers;
