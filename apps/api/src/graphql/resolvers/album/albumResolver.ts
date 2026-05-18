import { AlbumItemSortBy, CommentTargetType } from '@packages/contracts';
import { authenticatedResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { standardizeCollectionInput } from '../standardizeInput';

const albumResolvers: Resolvers = {
  Album: {
    coverMedia: authenticatedResolver((album) => {
      // Album ( parent ) always get coverMedia on query. If that stops
      // being the case we need to add the query here.
      return album.coverMedia;
    }),
    items: authenticatedResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<AlbumItemSortBy>(input.collectionInfo);

      const albumItemsResult = await ctx.readServices.viewerAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });

      return { ...albumItemsResult, pageInfo: collectionInfo.pageInfo };
    }),
    comments: authenticatedResolver(async (parent, args, ctx) => {
      const collectionInfo = args.input.collectionInfo;
      const nodes = await ctx.agnosticReadServices.commentReadService.listComments({
        targetType: CommentTargetType.album,
        targetId: parent.id,
        collectionInfo,
        viewerId: ctx.viewer?.id,
      });
      return {
        nodes,
        pageInfo: collectionInfo.pageInfo,
        totalCount: nodes.length,
      };
    }),
  },
};

export default albumResolvers;
