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
      const result = await ctx.writeServices.createMediaUpload({
        viewerId: ctx.viewer.id,
        kind: args.input.kind,
        mimeType: args.input.mimeType,
        originalFileName: args.input.originalFileName ?? undefined,
        albumId: args.input.albumId ?? undefined,
      });
      if (!result.success) {
        return result;
      }

      return ok({
        mediaItemId: result.value.mediaItemId,
        status: result.value.status,
        uploadInstructions: {
          method: result.value.uploadTarget.method,
          url: result.value.uploadTarget.url,
          headers: (result.value.uploadTarget.headers ?? []).map((h) => ({
            key: h.name,
            value: h.value,
          })),
        },
      });
    }),

    finalizeMediaUpload: authenticatedWriteResolver(async (_parent, args, ctx) => {
      return ctx.writeServices.finalizeMediaItemUpload({
        viewerId: ctx.viewer.id,
        mediaItemId: args.input.mediaItemId,
      });
    }),
    deleteMediaItem: authenticatedWriteResolver(async (_parent, args, ctx) => {
      return ctx.writeServices.deleteMediaItem({
        viewerId: ctx.viewer.id,
        mediaItemId: args.input.mediaItemId,
      });
    }),
    deleteMediaItems: authenticatedWriteResolver(async (_parent, args, ctx) => {
      return ctx.writeServices.deleteMediaItems({
        viewerId: ctx.viewer.id,
        mediaItemIds: args.input.mediaItemIds,
      });
    }),
    updateMediaItemDetails: authenticatedWriteResolver(
      async (_parent, args: MutationUpdateMediaItemDetailsArgs, ctx) => {
        const input = args.input;
        const command: UpdateMediaItemDetailsCommand = {
          ...input,
          viewerId: ctx.viewer.id,
        };

        return ctx.writeServices.updateMediaItem(command);
      },
    ),
    updateMediaItemTags: authenticatedWriteResolver(
      async (_parent, args: MutationUpdateMediaItemTagsArgs, ctx) => {
        const command: UpdateMediaItemTagsCommand = {
          viewerId: ctx.viewer.id,
          mediaItemId: args.input.mediaItemId,
          tags: args.input.tags,
        };
        return ctx.writeServices.updateMediaItemTags(command);
      },
    ),
  },
};

export default mediaUploadResolvers;
