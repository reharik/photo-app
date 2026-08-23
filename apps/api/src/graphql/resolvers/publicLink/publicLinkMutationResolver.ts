import type {
  CreatePublicLinkForAlbumCommand,
  CreatePublicLinkForMediaItemsCommand,
} from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const publicLinkMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    createPublicLinkForAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: CreatePublicLinkForAlbumCommand = {
        albumId: args.input.albumId,
        name: args.input.name ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };

      return ctx.writeServices.createPublicLinkForAlbum(command);
    }),

    createPublicLinkForMediaItems: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: CreatePublicLinkForMediaItemsCommand = {
        viewerFirstName: ctx.viewer.firstName,
        viewerLastName: ctx.viewer.lastName,
        mediaItemIds: args.input.mediaItemIds,
        name: args.input.name ?? undefined,
      };

      return ctx.writeServices.createPublicLinkForMediaItems(command);
    }),
  },
};

export default publicLinkMutationResolvers;
