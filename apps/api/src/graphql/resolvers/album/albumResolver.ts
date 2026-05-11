import { AlbumItemSortBy, CommentTargetType } from '@packages/contracts';
import { authenticatedResolver } from '../../context/contextWrappers';
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
      return ctx.readServices.applyAuthorizationService.toItem(album.coverMedia);
    }),
    items: authenticatedResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<AlbumItemSortBy>(input.collectionInfo);

      const albumItems = await ctx.readServices.viewerAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });

      const decoratedAlbumItems = await ctx.readServices.applyAuthorizationService.toNestedItems(
        albumItems.nodes,
        album.viewerMemberRole,
      );

      return {
        nodes: decoratedAlbumItems,
        pageInfo: albumItems.pageInfo,
      };
    }),
    comments: authenticatedResolver(async (parent, args, ctx) => {
      const collectionInfo = args.input.collectionInfo;
      return ctx.agnosticReadServices.commentReadService.listComments({
        targetType: CommentTargetType.album,
        targetId: parent.id,
        collectionInfo,
      });
    }),
  },
};

export default albumResolvers;
