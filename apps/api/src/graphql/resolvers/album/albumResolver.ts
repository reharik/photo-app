import { AlbumItemSortBy, EntityType } from '@packages/contracts';
import { authenticatedReadResolver } from '../../context/contextWrappers';
import type { AlbumMemberSortBy, Resolvers } from '../../generated/types.generated';
import { operationResultToPayload } from '../../util/operationResultToPayload';
import { standardizeCollectionInput } from '../standardizeInput';

const albumResolvers: Resolvers = {
  Album: {
    coverMedia: authenticatedReadResolver((album) => {
      // Album ( parent ) always get coverMedia on query. If that stops
      // being the case we need to add the query here.
      return album.coverMedia;
    }),
    items: authenticatedReadResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<AlbumItemSortBy>(input.collectionInfo);

      const albumItemsResult = await ctx.readServices.viewerAlbumReadService.getViewableAlbumItems({
        albumId: album.id,
        collectionInfo,
      });

      return { ...albumItemsResult, pageInfo: collectionInfo.pageInfo };
    }),
    albumMembers: authenticatedReadResolver(async (album, { input }, ctx) => {
      const collectionInfo = standardizeCollectionInput<AlbumMemberSortBy>(input.collectionInfo);

      const albumMembersResult =
        await ctx.readServices.viewerAlbumReadService.getAlbumMembersForAlbum({
          albumId: album.id,
          collectionInfo,
        });

      return { ...albumMembersResult, pageInfo: collectionInfo.pageInfo };
    }),
    comments: authenticatedReadResolver(async (parent, args, ctx) => {
      const collectionInfo = args.input.collectionInfo;
      const nodes = await ctx.agnosticReadServices.commentReadService.listComments({
        targetType: EntityType.album,
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
    resolveShareRecipients: authenticatedReadResolver(async (album, { emails }, ctx) => {
      const result = await ctx.readServices.viewerAlbumReadService.resolveShareRecipients({
        albumId: album.id,
        emails,
      });

      return operationResultToPayload(result);
    }),
    emailShares: authenticatedReadResolver(async (album, args, ctx) => {
      return ctx.readServices.viewerAuthorizationsReadService.listEmailSharesForAlbum({
        albumId: album.id,
      });
    }),
    publicLink: authenticatedReadResolver(async (album, args, ctx) => {
      return ctx.readServices.viewerAuthorizationsReadService.getPublicLinkTokenForAlbum({
        albumId: album.id,
      });
    }),
  },
};

export default albumResolvers;
