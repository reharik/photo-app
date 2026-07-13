import { ok } from '@packages/contracts';
import { GrantUserAuthorizationCommand } from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const authorizationMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    grantUserAuthorizationsForMediaItems: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationCommand = {
        viewerId: ctx.viewer.id,
        entityIds: args.input.mediaItemIds,
        operations: args.input.operations,
        grantedToHandles: args.input.grantedToHandles,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantAuthorizationForMediaItems(command);
      if (!result.success) {
        return result;
      }

      return ok({ userIds: result.value.invitedUsers.map((x) => x.id()) });
    }),

    grantUserAuthorizationForAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationCommand = {
        viewerId: ctx.viewer.id,
        entityIds: [args.input.albumId],
        operations: args.input.operations,
        grantedToHandles: args.input.grantedToHandles,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantUserAuthorizationForAlbum(command);
      if (!result.success) {
        return result;
      }

      return ok({ userIds: result.value.invitedUsers.map((u) => u.id()) });
    }),
  },
};

export default authorizationMutationResolvers;
