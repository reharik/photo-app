import type {
  GrantUserAuthorizationForAlbumCommand,
  GrantUserAuthorizationForMediaItemsCommand,
} from '@packages/media-core';
import { authenticatedResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';

const authorizationMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    grantUserAuthorizationsForMediaItems: authenticatedResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationForMediaItemsCommand = {
        viewerId: ctx.viewer.id,
        mediaItemIds: args.input.mediaItemIds,
        permissions: args.input.permissions,
        grantedToUserId: args.input.grantedToUserId ?? undefined,
        grantedToHandle: args.input.grantedToHandle ?? undefined,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantAuthorizationForMediaItems(command);

      if (!result.success) {
        return {
          success: false,
          token: undefined,
          authorization: undefined,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      return {
        success: true,
        authorizations: result.value.authorizations,
        errors: [],
      };
    }),

    grantUserAuthorizationForAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationForAlbumCommand = {
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        permission: args.input.permission,
        grantedToUserId: args.input.grantedToUserId ?? undefined,
        grantedToHandle: args.input.grantedToHandle ?? undefined,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantUserAuthorizationForAlbum(command);

      if (!result.success) {
        return {
          success: false,
          token: undefined,
          authorization: undefined,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      return {
        success: true,
        authorizations: result.value.authorizations,
        errors: [],
      };
    }),
  },
};

export default authorizationMutationResolvers;
