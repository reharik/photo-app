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
      const authorizedCoverMedia = await ctx.applyAuthorizationService.toItem(album.coverMedia);

      return authorizedCoverMedia;
    }),
    items: authenticatedResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<AlbumItemSortBy>(input.collectionInfo);

      const albumItems = await ctx.readServices.viewerAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });

      const decoratedAlbumItems = await ctx.applyAuthorizationService.toNestedItems(
        albumItems.nodes,
        album.viewerMemberRole,
      );

      return {
        nodes: decoratedAlbumItems,
        pageInfo: albumItems.pageInfo,
      };
    }),
  },
};

export default albumResolvers;
