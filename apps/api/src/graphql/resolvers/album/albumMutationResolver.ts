import type { AddMediaItemsToAlbumCommand, ReorderAlbumItemsCommand } from '@packages/media-core';
import { authenticatedResolver } from '../../context/contextWrappers';
import type {
  MutationAddMediaItemsToAlbumArgs,
  MutationReorderAlbumItemsArgs,
  Resolvers,
} from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';
import { writeResultToPayload } from '../../util/writeResultToPayload';

const albumResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    createAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.createAlbum({
        viewerId: ctx.viewer.id,
        title: args.input.title,
        description: args.input.description,
      });

      return writeResultToPayload(result);
    }),
    AddMediaItemToAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.addAlbumItem({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        mediaItemId: args.input.mediaItemId,
      });

      return {
        data: result.success
          ? {
              albumId: result.value.albumId,
              albumItemId: result.value.albumItemId,
            }
          : undefined,
        errors: result.success ? [] : [toContractErrorPayload(result.error)],
      };
    }),
    AddMediaItemsToAlbum: authenticatedResolver(
      async (_parent, args: MutationAddMediaItemsToAlbumArgs, ctx) => {
        const command: AddMediaItemsToAlbumCommand = {
          viewerId: ctx.viewer.id,
          mediaItemIds: args.input.mediaItemIds,
          albumId: args.input.albumId ?? undefined,
          newAlbum: args.input.newAlbum ?? undefined,
        };
        const result = await ctx.writeServices.addMediaItemsToAlbum(command);
        return writeResultToPayload(result);
      },
    ),
    ReorderAlbumItems: authenticatedResolver(
      async (_parent, args: MutationReorderAlbumItemsArgs, ctx) => {
        const command: ReorderAlbumItemsCommand = {
          viewerId: ctx.viewer.id,
          albumId: args.input.albumId,
          albumItemIds: args.input.albumItemIds,
        };
        const result = await ctx.writeServices.reorderAlbumItems(command);
        return writeResultToPayload(result);
      },
    ),
    DeleteAlbumItemsFromAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.deleteAlbumItems({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        albumItemIds: args.input.albumItemIds,
      });

      return writeResultToPayload(result);
    }),

    SetCoverMedia: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.setCoverMedia({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        albumItemId: args.input.albumItemId,
      });
      return writeResultToPayload(result);
    }),
    UnsetCoverMedia: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.unsetCoverMedia({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
      });
      return writeResultToPayload(result);
    }),
  },
};

export default albumResolvers;
