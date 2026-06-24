import { AlbumItemSortBy, CommentTargetType } from '@packages/contracts';
import { authenticatedReadResolver, publicResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { standardizeCollectionInput } from '../standardizeInput';

const publicAlbumResolver: Pick<Resolvers, 'PublicAlbum'> = {
  PublicAlbum: {
    coverMedia: publicResolver((album) => {
      // Album ( parent ) always get coverMedia on query. If that stops
      // being the case we need to add the query here.
      return album.coverMedia;
    }),
    items: publicResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<AlbumItemSortBy>(input.collectionInfo);

      const { nodes, totalCount } =
        await ctx.publicReadServices.publicAlbumReadService.getViewableAlbumItems({
          albumId: album.id,
          collectionInfo,
        });

      return { nodes, totalCount, pageInfo: collectionInfo.pageInfo };
    }),
    comments: authenticatedReadResolver(async (parent, args, ctx) => {
      const collectionInfo = args.input.collectionInfo;
      const nodes = await ctx.agnosticReadServices.commentReadService.listComments({
        targetType: CommentTargetType.album,
        targetId: parent.id,
        collectionInfo,
      });
      return {
        nodes,
        pageInfo: collectionInfo.pageInfo,
        totalCount: nodes.length,
      };
    }),
  },
};

export default publicAlbumResolver;
