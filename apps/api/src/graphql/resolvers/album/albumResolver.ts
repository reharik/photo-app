import { AlbumItemSortBy } from '@packages/contracts';
import { authenticatedResolver } from '../../context/authenticatedContext';
import type { Resolvers } from '../../generated/types.generated';
import { standardizeCollectionInput } from '../standardizeInput';

const albumResolvers: Resolvers = {
  Album: {
    items: authenticatedResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput(input.collectionInfo, AlbumItemSortBy);

      return ctx.readServices.viewerAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });
    }),
    shares: authenticatedResolver(async (parent, _args, ctx) => {
      return ctx.readServices.viewerShareReadService.getAlbumShares({
        albumId: parent.id,
      });
    }),
  },
};

export default albumResolvers;
