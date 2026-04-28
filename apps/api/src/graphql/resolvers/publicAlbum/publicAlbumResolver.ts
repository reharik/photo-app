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
      const permissionMap = await mediaItemPermissionsForToken(
        ctx.readServices.publicMediaItemPermissionService,
        () => [album.coverMedia!.id],
      );

      return {
        ...album.coverMedia,
        viewerOperations: permissionMap.get(album.coverMedia.id) ?? [],
      };
    },
    items: async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, AlbumItemSortBy);

      const albumItems = await ctx.readServices.publicAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });
      const permissionMap = await mediaItemPermissionsForToken(
        ctx.readServices.publicMediaItemPermissionService,
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
    },
  },
};

export default publicAlbumResolver;
