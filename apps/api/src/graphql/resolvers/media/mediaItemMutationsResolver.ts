import type {
  UpdateMediaItemDetailsCommand,
  UpdateMediaItemTagsCommand,
} from '@packages/media-core';
import { authenticatedResolver } from '../../context/contextWrappers';
import type {
  MutationUpdateMediaItemDetailsArgs,
  MutationUpdateMediaItemTagsArgs,
  Resolvers,
} from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';
import { writeResultToPayload } from '../../util/writeResultToPayload';

const mediaUploadResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    createMediaUpload: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.createMediaUpload({
        viewerId: ctx.viewer.id,
        kind: args.input.kind,
        mimeType: args.input.mimeType,
        originalFileName: args.input.originalFileName ?? undefined,
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

    finalizeMediaUpload: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.finalizeMediaItemUpload({
        viewerId: ctx.viewer.id,
        mediaItemId: args.input.mediaItemId,
      });
      return writeResultToPayload(result);

      // return {
      //   data: result.success
      //     ? {
      //         mediaItemId: result.value.mediaItemId,
      //         status: result.value.status,
      //         mimeType: result.value.mimeType,
      //         size: result.value.size,
      //         kind: result.value.kind,
      //       }
      //     : undefined,
      //   errors: result.success ? [] : [toContractErrorPayload(result.error)],
      // };
    }),
    deleteMediaItem: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.deleteMediaItem({
        viewerId: ctx.viewer.id,
        mediaItemId: args.input.mediaItemId,
      });

      return writeResultToPayload(result);
    }),
    deleteMediaItems: authenticatedResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.deleteMediaItems({
        viewerId: ctx.viewer.id,
        mediaItemIds: args.input.mediaItemIds,
      });
      return writeResultToPayload(result);
    }),
    updateMediaItemDetails: authenticatedResolver(
      async (_parent, args: MutationUpdateMediaItemDetailsArgs, ctx) => {
        const input = args.input;
        const command: UpdateMediaItemDetailsCommand = {
          ...input,
          viewerId: ctx.viewer.id,
        };

        const result = await ctx.writeServices.updateMediaItem(command);
        return writeResultToPayload(result);

        // return {
        //   data: result.success
        //     ? {
        //         mediaItemId: result.value.mediaItemId,
        //         title: result.value.title,
        //         description: result.value.description,
        //         takenAt: result.value.takenAt,
        //       }
        //     : undefined,
        //   errors: result.success ? [] : [toContractErrorPayload(result.error)],
        // };
      },
    ),
    updateMediaItemTags: authenticatedResolver(
      async (_parent, args: MutationUpdateMediaItemTagsArgs, ctx) => {
        const command: UpdateMediaItemTagsCommand = {
          viewerId: ctx.viewer.id,
          mediaItemId: args.input.mediaItemId,
          tags: args.input.tags,
        };
        const result = await ctx.writeServices.updateMediaItemTags(command);
        // return {
        //   data: result.success
        //     ? {
        //         mediaItemId: result.value.mediaItemId,
        //         tags: result.value.tags,
        //       }
        //     : undefined,
        //   errors: result.success ? [] : [toContractErrorPayload(result.error)],
        // };
        return writeResultToPayload(result);
      },
    ),
  },
};

export default mediaUploadResolvers;
