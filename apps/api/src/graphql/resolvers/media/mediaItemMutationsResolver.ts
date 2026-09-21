import { ok } from '@packages/contracts';
import type {
  UpdateMediaItemDetailsCommand,
  UpdateMediaItemTagsCommand,
} from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type {
  MutationUpdateMediaItemDetailsArgs,
  MutationUpdateMediaItemTagsArgs,
  Resolvers,
} from '../../generated/types.generated';

const mediaUploadResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    createMediaUpload: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.createMediaUpload(args.input);
      if (!result.success) {
        return result;
      }

      const output = result.value.map((x) => ({
        mediaItemId: x.mediaItemId,
        status: x.status,
        clientId: x.clientId,
        uploadInstructions: {
          method: x.uploadTarget.method,
          url: x.uploadTarget.url,
          headers: (x.uploadTarget.headers ?? []).map((h) => ({
            key: h.name,
            value: h.value,
          })),
        },
      }));

      return ok(output);
    }),

    finalizeMediaUpload: authenticatedWriteResolver(async (_parent, args, ctx) => {
      return ctx.writeServices.finalizeMediaItemUpload({
        mediaItemId: args.input.mediaItemId,
      });
    }),
    deleteMediaItem: authenticatedWriteResolver(async (_parent, args, ctx) => {
      return ctx.writeServices.deleteMediaItem({
        mediaItemId: args.input.mediaItemId,
      });
    }),
    deleteMediaItems: authenticatedWriteResolver(async (_parent, args, ctx) => {
      return ctx.writeServices.deleteMediaItems({
        mediaItemIds: args.input.mediaItemIds,
      });
    }),
    updateMediaItemDetails: authenticatedWriteResolver(
      async (_parent, args: MutationUpdateMediaItemDetailsArgs, ctx) => {
        const input = args.input;
        const command: UpdateMediaItemDetailsCommand = {
          ...input,
        };

        return ctx.writeServices.updateMediaItem(command);
      },
    ),
    updateMediaItemTags: authenticatedWriteResolver(
      async (_parent, args: MutationUpdateMediaItemTagsArgs, ctx) => {
        const command: UpdateMediaItemTagsCommand = {
          mediaItemId: args.input.mediaItemId,
          tags: args.input.tags,
        };
        return ctx.writeServices.updateMediaItemTags(command);
      },
    ),
  },
};

export default mediaUploadResolvers;
