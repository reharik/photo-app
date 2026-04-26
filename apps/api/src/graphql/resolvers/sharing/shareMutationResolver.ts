import { SharePermission } from '@packages/contracts';
import type { GrantAlbumShareCommand, GrantMediaItemShareCommand } from '@packages/media-core';
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
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantMediaItemShare(command);
      //TODO return should have the token if it was a share link
      return {
        data: result.success ? { shareId: result.value.shareId } : undefined,
        errors: result.success ? [] : [toContractErrorPayload(result.error)],
      };
    }),
    grantAlbumShare: authenticatedResolver(async (_parent, args, ctx) => {
      const command: GrantAlbumShareCommand = {
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        permission: SharePermission.fromValue(args.input.permission),
        grantedToUserId: args.input.grantedToUserId ?? undefined,
        grantedToHandle: args.input.grantedToHandle ?? undefined,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantAlbumShare(command);

      //TODO return should have the token if it was a share link
      return {
        data: result.success ? { shareId: result.value.shareId } : undefined,
        errors: result.success ? [] : [toContractErrorPayload(result.error)],
      };
    }),
  },
};

export default shareMutationResolvers;
