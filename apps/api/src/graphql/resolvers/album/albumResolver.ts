import { AlbumItemSortBy } from '@packages/contracts';
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
      const permissionMap =
        await ctx.readServices.viewerMediaItemPermissionService.getPermissionsForViewer([
          album.coverMedia.id,
        ]);

      return {
        ...album.coverMedia,
        viewerOperations: permissionMap[0]?.operations ?? [],
      };
    }),
    items: authenticatedResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, AlbumItemSortBy);

      const albumItems = await ctx.readServices.viewerAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });
      const permissionMap =
        await ctx.readServices.viewerMediaItemPermissionService.getPermissionsForViewer(
          albumItems.nodes.map((n) => n.mediaItem.id),
        );

      return {
        nodes: albumItems.nodes.map((n) => {
          const viewerOperations =
            permissionMap.find((x) => x.mediaItemId === n.mediaItem.id)?.operations ?? [];
          return {
            ...n,
            mediaItem: {
              ...n.mediaItem,
              viewerOperations,
            },
            viewerOperations,
          };
        }),
        pageInfo: albumItems.pageInfo,
      };
    }),
    authorizations: authenticatedResolver(async (parent, _args, ctx) => {
      return ctx.readServices.viewerAuthorizationReadService.getAlbumAuthorizations({
        albumId: parent.id,
      });
    }),
  },
};

export default albumResolvers;
