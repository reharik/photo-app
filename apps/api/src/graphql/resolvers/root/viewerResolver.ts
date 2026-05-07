import { AlbumSortBy, MediaItemSortBy } from '@packages/contracts';
import { authenticatedResolver } from '../../context/contextWrappers';
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
      const collectionInfo = standardizeCollectionInput<AlbumSortBy>(input.collectionInfo);
      const albumsRows =
        (await ctx.readServices.viewerAlbumReadService.listAlbums(collectionInfo)) || [];

      const authorizedAlbums = await ctx.readServices.applyAuthorizationService.toAlbums(
        albumsRows.nodes,
      );

      return {
        nodes: authorizedAlbums,
        pageInfo: albumsRows.pageInfo,
      };
    }),
    album: authenticatedResolver(async (_parent, { id }, ctx) => {
      const album = await ctx.readServices.viewerAlbumReadService.getAlbum(id);
      if (!album) {
        return undefined;
      }
      const authorizedAlbum = await ctx.readServices.applyAuthorizationService.toAlbum(album);

      return authorizedAlbum;
    }),
    mediaItem: authenticatedResolver(async (_parent, { id }, ctx) => {
      const item = await ctx.readServices.viewerMediaItemReadService.getMediaItemForViewer({
        mediaItemId: id,
      });
      if (!item) {
        return undefined;
      }
      return ctx.readServices.applyAuthorizationService.toItem(item);
    }),

    mediaItems: authenticatedResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<MediaItemSortBy>(input.collectionInfo);
      const mediaItems =
        (await ctx.readServices.viewerMediaItemReadService.listMediaItems(collectionInfo)) ||
        undefined;

      const authorizedItems = await ctx.readServices.applyAuthorizationService.toItems(
        mediaItems.nodes,
      );
      return {
        nodes: authorizedItems,
        pageInfo: mediaItems.pageInfo,
      };
    }),
    shareContacts: authenticatedResolver(async (_parent, _args, ctx) => {
      return ctx.readServices.viewerSharedContactsReadService.getShareContacts();
    }),
    sharedWithMeMediaItems: authenticatedResolver(async (_parent, _args, ctx) => {
      const { mediaItems } =
        await ctx.readServices.viewerSharedWithMeMediaItemReadService.getSharedWithMeMediaItems();
      return await ctx.readServices.applyAuthorizationService.toNestedItems(mediaItems);
    }),
    // sharedWithMeAlbums: authenticatedResolver(async (_parent, _args, ctx) => {
    //   const { albums } =
    //     await ctx.readServices.viewerSharedWithMeAlbumReadService.getSharedWithMeAlbums();
    //   const decoratedAlbums = albums.map((x) => ({
    //     ...x,
    //     viewerIsOwner: false,
    //     viewerOperations: x.viewerMemberRole?.operations ?? [],
    //   }));
    //   return {
    //     nodes: decoratedAlbums,
    //   };
    // }),
  },
};

export default viewerResolvers;
