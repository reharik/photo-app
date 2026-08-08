import { ok } from '@packages/contracts';
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
        operations: args.input.operations,
        grantedToHandles: args.input.grantedToHandles,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantUserAuthorization(command, true);
      if (!result.success) {
        return result;
      }

      return ok({ userIds: result.value.succeeded.map((x) => x.item.id()) });
    }),

    grantUserAuthorizationForAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationCommand = {
        viewerId: ctx.viewer.id,
        viewerFirstName: ctx.viewer.firstName,
        viewerLastName: ctx.viewer.lastName,
        entityIds: [args.input.albumId],
        operations: args.input.operations,
        grantedToHandles: args.input.grantedToHandles,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantUserAuthorization(command, false);
      if (!result.success) {
        return result;
      }

      return ok({ userIds: result.value.succeeded.map((x) => x.item.id()) });
    }),
  },
};

export default authorizationMutationResolvers;
