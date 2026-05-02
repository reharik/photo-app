import { AlbumMemberRole, AlbumSortBy, MediaItemSortBy } from '@packages/contracts';
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
      const albumsRows =
        (await ctx.readServices.viewerAlbumReadService.listAlbums(collectionInfo)) || [];
      const albums = albumsRows.nodes.map((row) => {
        const viewerOperations = ctx.readServices.viewerAlbumAuthzReadService.getAuthz({
          viewerMemberRole: row.viewerMemberRole,
        });
        return {
          ...row,
          viewerIsOwner: row.viewerMemberRole === AlbumMemberRole.owner.value,
          viewerOperations,
        };
      });

      return {
        nodes: albums,
        pageInfo: albumsRows.pageInfo,
      };
    }),
    album: authenticatedResolver(async (_parent, { id }, ctx) => {
      const album = await ctx.readServices.viewerAlbumReadService.getAlbum(id);
      if (!album) {
        return undefined;
      }
      const viewerOperations = ctx.readServices.viewerAlbumAuthzReadService.getAuthz({
        viewerMemberRole: album.viewerMemberRole,
      });

      return {
        ...album,
        viewerOperations,
        viewerIsOwner: album.viewerMemberRole === AlbumMemberRole.owner.value,
      };
    }),
    mediaItem: authenticatedResolver(async (_parent, { id }, ctx) => {
      const item = await ctx.readServices.viewerMediaItemReadService.getMediaItemForViewer({
        mediaItemId: id,
      });
      if (!item) {
        return undefined;
      }
      return ctx.readServices.viewerMediaItemAuthzService.addAuthzToItem(item);
    }),
    mediaItems: authenticatedResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, MediaItemSortBy);
      const mediaItems =
        (await ctx.readServices.viewerMediaItemReadService.listMediaItems(collectionInfo)) ||
        undefined;

      const decoratedItems = await ctx.readServices.viewerMediaItemAuthzService.addAuthzToItems(
        mediaItems.nodes,
      );
      return {
        nodes: decoratedItems,
        pageInfo: mediaItems.pageInfo,
      };
    }),
    shareContacts: authenticatedResolver(async (_parent, _args, ctx) => {
      return ctx.readServices.viewerAlbumAuthzReadService.getShareContacts();
    }),
    sharedWithMeMediaItems: authenticatedResolver(async (_parent, _args, ctx) => {
      const { mediaItems } =
        await ctx.readServices.viewerSharedWithMeMediaItemReadService.getSharedWithMeMediaItems();
      return await ctx.readServices.viewerMediaItemAuthzService.addAuthzToItems(mediaItems);
    }),
    sharedWithMeAlbums: authenticatedResolver(async (_parent, _args, ctx) => {
      const { albums } =
        await ctx.readServices.viewerSharedWithMeAlbumReadService.getSharedWithMeAlbums();
      const decoratedAlbums = albums.map((x) => ({
        ...x,
        viewerOperations: ctx.readServices.viewerAlbumAuthzReadService.getAuthz(x),
        viewerIsOwner: false,
      }));
      return {
        nodes: decoratedAlbums,
      };
    }),
  },
};

export default viewerResolvers;
