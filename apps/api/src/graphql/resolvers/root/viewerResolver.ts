import {
  AlbumSortBy,
  MediaItemSortBy,
  SharedWithMeAlbumSortBy,
  SharedWithMeMediaItemSortBy,
} from '@packages/contracts';
import { authenticatedReadResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { ViewerParent } from '../parentModels';
import { standardizeCollectionInput } from '../standardizeInput';

const viewerResolvers: Pick<Resolvers, 'Query' | 'Viewer'> = {
  Query: {
    viewer: (_p, _a, ctx): ViewerParent | undefined => {
      if (ctx.kind !== 'authenticatedRead' && ctx.kind !== 'authenticatedWrite') {
        return undefined;
      }
      return ctx.viewer;
    },
  },
  Viewer: {
    albums: authenticatedReadResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<AlbumSortBy>(input.collectionInfo);
      const albumsRows =
        (await ctx.readServices.viewerAlbumReadService.listAlbums(collectionInfo)) || [];

      return {
        nodes: albumsRows.nodes,
        pageInfo: collectionInfo.pageInfo,
        totalCount: albumsRows.totalCount,
      };
    }),
    album: authenticatedReadResolver(async (_parent, { id }, ctx) => {
      return ctx.readServices.viewerAlbumReadService.getAlbum(id);
    }),
    mediaItem: authenticatedReadResolver(async (_parent, { id }, ctx) => {
      return await ctx.readServices.viewerMediaItemReadService.getMediaItemForViewer({
        mediaItemId: id,
      });
    }),

    mediaItems: authenticatedReadResolver(async (_parent, { input }, ctx) => {
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
    shareContacts: authenticatedReadResolver(async (_parent, _args, ctx) => {
      return ctx.readServices.viewerSharedContactsReadService.getShareContacts();
    }),
    sharedWithMeMediaItems: authenticatedReadResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<SharedWithMeMediaItemSortBy>(
        input.collectionInfo,
      );
      const mediaItemsResult =
        await ctx.readServices.viewerSharedWithMeMediaItemReadService.getSharedWithMeMediaItems(
          collectionInfo,
        );
      return {
        nodes: mediaItemsResult.nodes,
        totalCount: mediaItemsResult.totalCount,
        pageInfo: collectionInfo.pageInfo,
      };
    }),
    sharedWithMeAlbums: authenticatedReadResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<SharedWithMeAlbumSortBy>(
        input.collectionInfo,
      );
      const albumsRows =
        (await ctx.readServices.viewerSharedWithMeAlbumReadService.listAlbums(collectionInfo)) ||
        [];

      return {
        nodes: albumsRows.nodes,
        pageInfo: collectionInfo.pageInfo,
        totalCount: albumsRows.totalCount,
      };
    }),
    inAppNotification: authenticatedReadResolver(async (_parent, args, ctx) => {
      return ctx.readServices.viewerHasInAppNotificationService.getInAppNotification();
    }),
  },
};

export default viewerResolvers;
