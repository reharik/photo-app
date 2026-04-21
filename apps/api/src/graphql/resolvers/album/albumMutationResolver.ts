import type { AddMediaItemsToAlbumCommand, ReorderAlbumItemsCommand } from '@packages/media-core';
import { authenticatedResolver } from '../../context/authenticatedContext';
import type {
  MutationAddMediaItemsToAlbumArgs,
  MutationReorderAlbumItemsArgs,
  Resolvers,
} from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';

const albumResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    createAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.createAlbum({
        viewerId: ctx.viewer.id,
        title: args.input.title,
        description: args.input.description,
      });

      return {
        data: result.success ? { albumId: result.value.albumId } : undefined,
        errors: result.success ? [] : [toContractErrorPayload(result.error)],
      };
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

        return {
          data: result.success
            ? {
                albumId: result.value.albumId,
                albumItemIds: result.value.albumItemIds,
              }
            : undefined,
          errors: result.success ? [] : [toContractErrorPayload(result.error)],
        };
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
        return {
          data: result.success ? { albumId: result.value.albumId } : undefined,
          errors: result.success ? [] : [toContractErrorPayload(result.error)],
        };
      },
    ),
    DeleteAlbumItemsFromAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.deleteAlbumItems({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        albumItemIds: args.input.albumItemIds,
      });

      return {
        data: result.success
          ? {
              albumId: result.value.albumId,
              albumItemIds: result.value.albumItemIds,
            }
          : undefined,
        errors: result.success ? [] : [toContractErrorPayload(result.error)],
      };
    }),

    SetCoverMedia: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.setCoverMedia({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        mediaItemId: args.input.mediaItemId,
      });
      return {
        data: result.success
          ? {
              albumId: result.value.albumId,
              mediaCoverId: result.value.mediaCoverId,
            }
          : undefined,
        errors: result.success ? [] : [toContractErrorPayload(result.error)],
      };
    }),
    UnsetCoverMedia: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.unsetCoverMedia({
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
      });
      return {
        data: result.success
          ? {
              albumId: result.value.albumId,
            }
          : undefined,
        errors: result.success ? [] : [toContractErrorPayload(result.error)],
      };
    }),
  },
};

export default albumResolvers;
