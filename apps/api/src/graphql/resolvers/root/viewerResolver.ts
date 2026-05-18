import { AlbumSortBy, MediaItemSortBy } from '@packages/contracts';
import { authenticatedResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { ViewerParent } from '../parentModels';
import { standardizeCollectionInput } from '../standardizeInput';

const viewerResolvers: Pick<Resolvers, 'Query' | 'Viewer'> = {
  Query: {
    viewer: (_p, _a, ctx): ViewerParent | undefined => {
      if (ctx.kind !== 'authenticated') {
        return undefined;
      }
      return ctx.viewer;
    },
  },
  Viewer: {
    albums: authenticatedResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<AlbumSortBy>(input.collectionInfo);
      const albumsRows =
        (await ctx.readServices.viewerAlbumReadService.listAlbums(collectionInfo)) || [];

      return {
        nodes: albumsRows.nodes,
        pageInfo: collectionInfo.pageInfo,
        totalCount: albumsRows.totalCount,
      };
    }),
    album: authenticatedResolver(async (_parent, { id }, ctx) => {
      return ctx.readServices.viewerAlbumReadService.getAlbum(id);
    }),
    mediaItem: authenticatedResolver(async (_parent, { id }, ctx) => {
      return await ctx.readServices.viewerMediaItemReadService.getMediaItemForViewer({
        mediaItemId: id,
      });
    }),

    mediaItems: authenticatedResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<MediaItemSortBy>(input.collectionInfo);
      const mediaItemsResult =
        await ctx.readServices.viewerMediaItemReadService.listMediaItems(collectionInfo);

      // be sure and update pageInfo when we have a paged list
      return {
        nodes: mediaItemsResult.nodes,
        totalCount: mediaItemsResult.totalCount,
        pageInfo: collectionInfo.pageInfo,
      };
    }),
    shareContacts: authenticatedResolver(async (_parent, _args, ctx) => {
      return ctx.readServices.viewerSharedContactsReadService.getShareContacts();
    }),
    sharedWithMeMediaItems: authenticatedResolver(async (_parent, _args, ctx) => {
      return await ctx.readServices.viewerSharedWithMeMediaItemReadService.getSharedWithMeMediaItems();
    }),
  },
};

export default viewerResolvers;
