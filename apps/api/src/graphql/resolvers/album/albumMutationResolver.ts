import { ok } from '@packages/contracts';
import type {
  AddAlbumMembersCommand,
  AddMediaItemsToAlbumCommand,
  RemoveAlbumMembersCommand,
  ReorderAlbumItemsCommand,
} from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type {
  MutationAddAlbumMembersArgs,
  MutationAddMediaItemsToAlbumArgs,
  MutationRemoveAlbumMembersArgs,
  MutationReorderAlbumItemsArgs,
  Resolvers,
} from '../../generated/types.generated';

const albumResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    createAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.createAlbum({
        title: args.input.title,
        description: args.input.description,
      });

      return result;
    }),

    AddMediaItemsToAlbum: authenticatedWriteResolver(
      async (_parent, args: MutationAddMediaItemsToAlbumArgs, ctx) => {
        const command: AddMediaItemsToAlbumCommand = {
          mediaItemIds: args.input.mediaItemIds,
          albumId: args.input.albumId ?? undefined,
          newAlbum: args.input.newAlbum ?? undefined,
        };
        const result = await ctx.writeServices.addMediaItemsToAlbum(command);
        return result;
      },
    ),
    AddAlbumMembers: authenticatedWriteResolver(
      async (_parent, args: MutationAddAlbumMembersArgs, ctx) => {
        const command: AddAlbumMembersCommand = {
          role: args.input.role,
          userIds: args.input.userIds,
          albumId: args.input.albumId ?? undefined,
        };
        const result = await ctx.writeServices.addAlbumMembers(command);
        if (!result.success) {
          return result;
        }
        return ok({
          albumId: args.input.albumId,
          albumMemberIds: result.value.succeeded.map((x) => x.value),
        });
      },
    ),
    RemoveAlbumMembers: authenticatedWriteResolver(
      async (_parent, args: MutationRemoveAlbumMembersArgs, ctx) => {
        const command: RemoveAlbumMembersCommand = {
          albumMemberIds: args.input.albumMemberIds,
          albumId: args.input.albumId ?? undefined,
        };
        const result = await ctx.writeServices.removeAlbumMembers(command);
        if (!result.success) {
          return result;
        }
        return ok({
          albumId: args.input.albumId,
          albumMemberIds: result.value.succeeded.map((x) => x.value),
        });
      },
    ),
    ReorderAlbumItems: authenticatedWriteResolver(
      async (_parent, args: MutationReorderAlbumItemsArgs, ctx) => {
        const command: ReorderAlbumItemsCommand = {
          albumId: args.input.albumId,
          albumItemIds: args.input.albumItemIds,
        };
        const result = await ctx.writeServices.reorderAlbumItems(command);
        return result;
      },
    ),
    DeleteAlbumItemsFromAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.deleteAlbumItems({
        albumId: args.input.albumId,
        albumItemIds: args.input.albumItemIds,
      });

      return result;
    }),

    SetCoverMedia: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.setCoverMedia({
        albumId: args.input.albumId,
        albumItemId: args.input.albumItemId,
      });
      return result;
    }),
    UnsetCoverMedia: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.unsetCoverMedia({
        albumId: args.input.albumId,
      });
      return result;
    }),

    RevokeShareAuthentication: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.revokeShareService({
        albumId: args.input.albumId,
        authorizationId: args.input.authorizationId,
      });
      return result;
    }),

    RevokePublicLinkAuthentication: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.revokePublicLinkService({
        albumId: args.input.albumId,
      });
      return result;
    }),
    UpdateAlbumMemberRole: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.updateAlbumMemberRoleService({
        albumId: args.input.albumId,
        albumMemberId: args.input.albumMemberId,
        role: args.input.role,
      });
      return result;
    }),
  },
};

export default albumResolvers;
