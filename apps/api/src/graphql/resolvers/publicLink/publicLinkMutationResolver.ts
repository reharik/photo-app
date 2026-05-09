import type {
  CreatePublicLinkForAlbumCommand,
  CreatePublicLinkForMediaItemsCommand,
} from '@packages/media-core';
import { authenticatedResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';

const publicLinkMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    createPublicLinkForAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const command: CreatePublicLinkForAlbumCommand = {
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        name: args.input.name ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };

      const result = await ctx.writeServices.createPublicLinkForAlbum(command);
      if (!result.success) {
        return {
          success: false,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      return {
        success: true,
        data: { token: result.value.token },
      };
    }),

    createPublicLinkForMediaItems: authenticatedResolver(async (_parent, args, ctx) => {
      const command: CreatePublicLinkForMediaItemsCommand = {
        viewerId: ctx.viewer.id,
        mediaItemIds: args.input.mediaItemIds,
        name: args.input.name ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };

      const result = await ctx.writeServices.createPublicLinkForMediaItems(command);
      if (!result.success) {
        return {
          success: false,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      return {
        success: true,
        data: { token: result.value.token },
      };
    }),
  },
};

export default publicLinkMutationResolvers;
