import { AlbumItemSortBy } from '@packages/contracts';
import type { Resolvers } from '../../generated/types.generated';
import { standardizeCollectionInput } from '../standardizeInput';

const publicAlbumResolver: Pick<Resolvers, 'PublicAlbum'> = {
  PublicAlbum: {
    coverMedia: async (album, _args, ctx) => {
      // Album ( parent ) always get coverMedia on query. If that stops
      // being the case we need to add the query here.
      if (!album.coverMedia) {
        return undefined;
      }
      const permissionMap =
        await ctx.readServices.publicMediaItemPermissionService.getPermissionsForPublicLink([
          album.coverMedia.id,
        ]);

      return {
        ...album.coverMedia,
        viewerOperations: permissionMap[0]?.operations ?? [],
      };
    },
    items: async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, AlbumItemSortBy);

      const albumItems = await ctx.readServices.publicAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });
      const permissionMap =
        await ctx.readServices.publicMediaItemPermissionService.getPermissionsForPublicLink(
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
    },
  },
};

export default publicAlbumResolver;
