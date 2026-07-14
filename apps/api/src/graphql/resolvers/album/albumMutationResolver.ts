import type { AddMediaItemsToAlbumCommand, ReorderAlbumItemsCommand } from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type {
  MutationAddMediaItemsToAlbumArgs,
  MutationReorderAlbumItemsArgs,
  Resolvers,
} from '../../generated/types.generated';

const albumResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    createAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.createAlbum({
        viewerId: ctx.viewer.id,
        title: args.input.title,
        description: args.input.description,
      });

      return result;
    }),

    AddMediaItemsToAlbum: authenticatedWriteResolver(
      async (_parent, args: MutationAddMediaItemsToAlbumArgs, ctx) => {
        const command: AddMediaItemsToAlbumCommand = {
          viewerId: ctx.viewer.id,
          mediaItemIds: args.input.mediaItemIds,
          albumId: args.input.albumId ?? undefined,
          newAlbum: args.input.newAlbum ?? undefined,
        };
        const result = await ctx.writeServices.addMediaItemsToAlbum(command);
        return result;
      },
    ),
    ReorderAlbumItems: authenticatedWriteResolver(
      async (_parent, args: MutationReorderAlbumItemsArgs, ctx) => {
        const command: ReorderAlbumItemsCommand = {
          viewerId: ctx.viewer.id,
          albumId: args.input.albumId,
          albumItemIds: args.input.albumItemIds,
        };
        const result = await ctx.writeServices.reorderAlbumItems(command);
        return result;
      },
    ),
    DeleteAlbumItemsFromAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.deleteAlbumItems({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        albumItemIds: args.input.albumItemIds,
      });

      return result;
    }),

    SetCoverMedia: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.setCoverMedia({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        albumItemId: args.input.albumItemId,
      });
      return result;
    }),
    UnsetCoverMedia: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.unsetCoverMedia({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
      });
      return result;
    }),
  },
};

export default albumResolvers;
