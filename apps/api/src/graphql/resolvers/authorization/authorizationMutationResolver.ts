import { WriteResult } from '@packages/contracts';
import { GrantUserAuthorizationCommand } from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { GrantUserAuthorizationPayload, Resolvers } from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';
import { writeResultToPayload } from '../../util/writeResultToPayload';

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
        return {
          success: false,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      return {
        success: true,
        userIds: result.value.invitedUsers.map((x) => x.id()),
        errors: [],
      };
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
        return {
          success: false,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      const resultPayload: WriteResult<GrantUserAuthorizationPayload> = {
        success: true,
        value: {
          userIds: result.value.invitedUsers.map((u) => u.id()),
        },
      };
      return writeResultToPayload(resultPayload);
    }),
  },
};

export default authorizationMutationResolvers;
