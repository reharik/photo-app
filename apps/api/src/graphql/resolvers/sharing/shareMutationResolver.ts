import { SharePermission } from '@packages/contracts';
import type {
  GrantAlbumShareCommand,
  GrantManyMediaItemSharesCommand,
  GrantMediaItemShareCommand,
} from '@packages/media-core';
import { authenticatedResolver } from '../../context/authenticatedContext';
import type { Resolvers } from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';

const shareMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    grantMediaItemShare: authenticatedResolver(async (_parent, args, ctx) => {
      const command: GrantMediaItemShareCommand = {
        viewerId: ctx.viewer.id,
        mediaItemId: args.input.mediaItemId,
        permission: SharePermission.fromValue(args.input.permission),
        grantedToUserId: args.input.grantedToUserId ?? undefined,
        grantedToHandle: args.input.grantedToHandle ?? undefined,
        token: args.input.token ?? undefined,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantMediaItemShare(command);

      if (!result.success) {
        return {
          success: false,
          token: undefined,
          share: undefined,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      return {
        success: true,
        token: result.value.token,
        share: result.value.share,
        errors: [],
      };
    }),
    grantManyMediaItemShares: authenticatedResolver(async (_parent, args, ctx) => {
      const command: GrantManyMediaItemSharesCommand = {
        viewerId: ctx.viewer.id,
        mediaItemIds: args.input.mediaItemIds,
        permission: SharePermission.fromValue(args.input.permission),
        grantedToUserId: args.input.grantedToUserId ?? undefined,
        grantedToHandle: args.input.grantedToHandle ?? undefined,
        token: args.input.token ?? undefined,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantManyMediaItemShares(command);

      if (!result.success) {
        return {
          success: false,
          token: undefined,
          shares: undefined,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      return {
        success: true,
        token: result.value.token,
        shares: result.value.shares,
        errors: [],
      };
    }),
    grantAlbumShare: authenticatedResolver(async (_parent, args, ctx) => {
      const command: GrantAlbumShareCommand = {
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        permission: SharePermission.fromValue(args.input.permission),
        grantedToUserId: args.input.grantedToUserId ?? undefined,
        grantedToHandle: args.input.grantedToHandle ?? undefined,
        token: args.input.token ?? undefined,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantAlbumShare(command);

      if (!result.success) {
        return {
          success: false,
          token: undefined,
          share: undefined,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      return {
        success: true,
        token: result.value.token,
        share: result.value.share,
        errors: [],
      };
    }),
  },
};

export default shareMutationResolvers;
