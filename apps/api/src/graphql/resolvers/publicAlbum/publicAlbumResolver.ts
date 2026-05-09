import { AlbumItemSortBy } from '@packages/contracts';
import { publicResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { standardizeCollectionInput } from '../standardizeInput';

const publicAlbumResolver: Pick<Resolvers, 'PublicAlbum'> = {
  PublicAlbum: {
    coverMedia: publicResolver(async (album, _args, ctx) => {
      // Album ( parent ) always get coverMedia on query. If that stops
      // being the case we need to add the query here.
      if (!album.coverMedia) {
        return undefined;
      }
      return ctx.publicReadServices.applyPublicAuthorizationService.toPublicItem(album.coverMedia);
    }),
    items: publicResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<AlbumItemSortBy>(input.collectionInfo);

      const albumItems = await ctx.publicReadServices.publicAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });

      const decoratedAlbumItems =
        await ctx.publicReadServices.applyPublicAuthorizationService.toPublicNestedItems(
          albumItems.nodes,
        );

      return {
        nodes: decoratedAlbumItems,
        pageInfo: albumItems.pageInfo,
      };
    }),
  },
};

export default publicAlbumResolver;
