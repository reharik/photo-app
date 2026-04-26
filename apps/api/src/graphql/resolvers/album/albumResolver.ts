import { AlbumItemSortBy } from '@packages/contracts';
import { authenticatedResolver } from '../../context/authenticatedContext';
import type { Resolvers } from '../../generated/types.generated';
import { standardizeCollectionInput } from '../standardizeInput';

const albumResolvers: Resolvers = {
  Album: {
    items: authenticatedResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, AlbumItemSortBy);

      const albumItems = await ctx.readServices.viewerAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });
      const permissions =
        await ctx.readServices.viewerMediaItemPermissionService.getPermissionsForViewer(
          albumItems.nodes.map((n) => n.mediaItem.id),
        );
      const permissionMap = new Map(permissions.map((p) => [p.mediaItemId, p.operations]));

      return {
        nodes: albumItems.nodes.map((n) => ({
          ...n,
          viewerOperations: permissionMap.get(n.mediaItem.id)?.map((o) => o.value) ?? [],
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
