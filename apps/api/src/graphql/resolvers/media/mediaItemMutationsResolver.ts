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
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';
import { writeResultToPayload } from '../../util/writeResultToPayload';

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

      return {
        data: result.success
          ? {
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
            }
          : undefined,
        errors: result.success ? [] : [toContractErrorPayload(result.error)],
      };
    }),

    finalizeMediaUpload: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.finalizeMediaItemUpload({
        viewerId: ctx.viewer.id,
        mediaItemId: args.input.mediaItemId,
      });
      return writeResultToPayload(result);
    }),
    deleteMediaItem: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.deleteMediaItem({
        viewerId: ctx.viewer.id,
        mediaItemId: args.input.mediaItemId,
      });

      return writeResultToPayload(result);
    }),
    deleteMediaItems: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.deleteMediaItems({
        viewerId: ctx.viewer.id,
        mediaItemIds: args.input.mediaItemIds,
      });
      return writeResultToPayload(result);
    }),
    updateMediaItemDetails: authenticatedWriteResolver(
      async (_parent, args: MutationUpdateMediaItemDetailsArgs, ctx) => {
        const input = args.input;
        const command: UpdateMediaItemDetailsCommand = {
          ...input,
          viewerId: ctx.viewer.id,
        };

        const result = await ctx.writeServices.updateMediaItem(command);
        return writeResultToPayload(result);
      },
    ),
    updateMediaItemTags: authenticatedWriteResolver(
      async (_parent, args: MutationUpdateMediaItemTagsArgs, ctx) => {
        const command: UpdateMediaItemTagsCommand = {
          viewerId: ctx.viewer.id,
          mediaItemId: args.input.mediaItemId,
          tags: args.input.tags,
        };
        const result = await ctx.writeServices.updateMediaItemTags(command);
        return writeResultToPayload(result);
      },
    ),
  },
};

export default mediaUploadResolvers;
