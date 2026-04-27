import { AlbumSortBy, MediaItemSortBy } from '@packages/contracts';
import { mediaItemPermissionsForViewer } from '../../../infrastructure/permissions/mediaItemPermissionsForViewer';
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
      const permissionMap = await mediaItemPermissionsForViewer(
        ctx.readServices.viewerMediaItemPermissionService,
        () => [id],
      );
      return {
        ...item,
        viewerOperations: permissionMap.get(id) ?? [],
      };
    }),
    mediaItems: authenticatedResolver(async (_parent, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, MediaItemSortBy);
      const mediaItems =
        (await ctx.readServices.viewerMediaItemReadService.listMediaItems(collectionInfo)) ||
        undefined;

      const permissionMap = await mediaItemPermissionsForViewer(
        ctx.readServices.viewerMediaItemPermissionService,
        () => mediaItems.nodes.map((n) => n.id),
      );

      return {
        nodes: mediaItems.nodes.map((n) => ({
          ...n,
          viewerOperations: permissionMap.get(n.id) ?? [],
        })),
        pageInfo: mediaItems.pageInfo,
      };
    }),
    shareContacts: authenticatedResolver(async (_parent, _args, ctx) => {
      return ctx.readServices.viewerShareReadService.getShareContacts();
    }),
    sharedMediaItems: authenticatedResolver(async (_parent, _args, ctx) => {
      const { mediaItems } = await ctx.readServices.viewerShareReadService.getSharedMediaItems();
      return mediaItems.map((row) => ({
        ...row,
        permission: row.permission as SharePermission,
        mediaItem: { ...row.mediaItem, viewerOperations: [] },
      }));
    }),
  },
};

export default viewerResolvers;
