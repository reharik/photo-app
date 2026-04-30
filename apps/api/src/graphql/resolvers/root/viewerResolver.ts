import { AlbumSortBy, MediaItemSortBy } from '@packages/contracts';
import { authenticatedResolver } from '../../context/authenticatedContext';
import type { Resolvers, SharePermission } from '../../generated/types.generated';
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
    mediaItem: authenticatedResolver(async (_parent, { id }, ctx) => {
      const item = await ctx.readServices.viewerMediaItemReadService.getMediaItemForViewer({
        mediaItemId: id,
      });
      if (!item) {
        return undefined;
      }
      const permissionMap =
        await ctx.readServices.viewerMediaItemPermissionService.getPermissionsForViewer([id]);
      return {
        ...item,
        viewerOperations: permissionMap[0]?.operations ?? [],
      };
    }),
    mediaItems: authenticatedResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, MediaItemSortBy);
      const mediaItems =
        (await ctx.readServices.viewerMediaItemReadService.listMediaItems(collectionInfo)) ||
        undefined;

      const permissionMap =
        await ctx.readServices.viewerMediaItemPermissionService.getPermissionsForViewer(
          mediaItems.nodes.map((n) => n.id),
        );

      return {
        nodes: mediaItems.nodes.map((n) => ({
          ...n,
          viewerOperations: permissionMap.find((x) => x.mediaItemId === n.id)?.operations ?? [],
        })),
        pageInfo: mediaItems.pageInfo,
      };
    }),
    shareContacts: authenticatedResolver(async (_parent, _args, ctx) => {
      return ctx.readServices.viewerAuthorizationReadService.getShareContacts();
    }),
    sharedMediaItems: authenticatedResolver(async (_parent, _args, ctx) => {
      const { mediaItems } =
        await ctx.readServices.viewerAuthorizationReadService.getSharedWithMeMediaItems();
      return mediaItems.map((row) => ({
        ...row,
        permission: row.permission as SharePermission,
        mediaItem: { ...row.mediaItem, viewerOperations: [] },
      }));
    }),
  },
};

export default viewerResolvers;
