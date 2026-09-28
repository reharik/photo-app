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
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';

const mediaUploadResolvers: Pick<Resolvers, 'Mutation' | 'CreateMediaUploadItemResult'> = {
  /**
   * The members carry no `__typename`, so the union needs an explicit discriminator. A refused
   * item is the only member with an `error`, which is also the only field the success branch
   * could never grow.
   */
  CreateMediaUploadItemResult: {
    __resolveType: (obj) =>
      'error' in obj ? 'CreateMediaUploadItemError' : 'CreateMediaUploadPayload',
  },
  Mutation: {
    createMediaUpload: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const result = await ctx.writeServices.createMediaUpload(args.input);
      if (!result.success) {
        return result;
      }

      // Per-item: a refusal fails only its own item and the rest of the batch is still
      // presigned. Batch-level failures (quota) took the `!result.success` path above.
      const output = result.value.map(({ clientId, result: item }) =>
        item.success
          ? {
              mediaItemId: item.value.mediaItemId,
              status: item.value.status,
              clientId,
              uploadInstructions: {
                method: item.value.uploadTarget.method,
                url: item.value.uploadTarget.url,
                headers: (item.value.uploadTarget.headers ?? []).map((h) => ({
                  key: h.name,
                  value: h.value,
                })),
              },
            }
          : { clientId, error: toContractErrorPayload(item) },
      );

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
