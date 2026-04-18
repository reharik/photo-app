import { AlbumSortBy, MediaItemSortBy } from '@packages/contracts';
import { authenticatedResolver } from '../../context/authenticatedContext';
import type { Resolvers } from '../../generated/types.generated';
import { ViewerParent } from '../parentModels';
import { standardizeCollectionInput } from '../standardizeInput';

const viewerResolvers: Pick<Resolvers, 'Query' | 'Viewer'> = {
  Query: {
    viewer: (_p, _a, ctx): ViewerParent | undefined => {
      return ctx.viewer;
    },
  },

  Viewer: {
    albums: authenticatedResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, AlbumSortBy);
      return (
        (await ctx.readServices.viewerAlbumReadService.listAlbums(collectionInfo)) || undefined
      );
    }),
    album: authenticatedResolver(async (_parent, { id }, ctx) => {
      return await ctx.readServices.viewerAlbumReadService.getAlbum(id);
    }),
    mediaItem: authenticatedResolver(async (_parent, { id }: { id: string }, ctx) => {
      return await ctx.readServices.viewerMediaItemReadService.getMediaItemForViewer({
        mediaItemId: id,
      });
    }),
    mediaItems: authenticatedResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, MediaItemSortBy);
      return (
        (await ctx.readServices.viewerMediaItemReadService.listMediaItems(collectionInfo)) ||
        undefined
      );
    }),
  },
};

export default viewerResolvers;
