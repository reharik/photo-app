import { AlbumItemSortBy } from '@packages/contracts';
import { mediaItemPermissionsForViewer } from '../../../infrastructure/permissions/mediaItemPermissionsForViewer';
import { authenticatedResolver } from '../../context/authenticatedContext';
import type { Resolvers } from '../../generated/types.generated';
import { standardizeCollectionInput } from '../standardizeInput';

const albumResolvers: Resolvers = {
  Album: {
    coverMedia: authenticatedResolver(async (album, _args, ctx) => {
      // Album ( parent ) always get coverMedia on query. If that stops
      // being the case we need to add the query here.
      if (!album.coverMedia) {
        return undefined;
      }
      const permissionMap = await mediaItemPermissionsForViewer(
        ctx.readServices.viewerMediaItemPermissionService,
        () => [album.coverMedia!.id],
      );

      return {
        ...album.coverMedia,
        viewerOperations: permissionMap.get(album.coverMedia.id) ?? [],
      };
    }),
    items: authenticatedResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, AlbumItemSortBy);

      const albumItems = await ctx.readServices.viewerAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });
      const permissionMap = await mediaItemPermissionsForViewer(
        ctx.readServices.viewerMediaItemPermissionService,
        () => albumItems.nodes.map((n) => n.mediaItem.id),
      );

      return {
        nodes: albumItems.nodes.map((n) => ({
          ...n,
          mediaItem: {
            ...n.mediaItem,

            viewerOperations: permissionMap.get(n.mediaItem.id) ?? [],
          },
          viewerOperations: permissionMap.get(n.mediaItem.id) ?? [],
        })),
        pageInfo: albumItems.pageInfo,
      };
    }),
    shares: authenticatedResolver(async (parent, _args, ctx) => {
      return ctx.readServices.viewerShareReadService.getAlbumShares({
        albumId: parent.id,
      });
    }),
  },
};

export default albumResolvers;
