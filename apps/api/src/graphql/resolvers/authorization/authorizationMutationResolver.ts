import type {
  GrantUserAuthorizationForAlbumCommand,
  GrantUserAuthorizationForMediaItemsCommand,
} from '@packages/media-core';
import { TemplateData } from '@packages/notifications';
import { authenticatedResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';

const authorizationMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    grantUserAuthorizationsForMediaItems: authenticatedResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationForMediaItemsCommand = {
        viewerId: ctx.viewer.id,
        mediaItemIds: args.input.mediaItemIds,
        operations: args.input.operations,
        grantedToHandle: args.input.grantedToHandle,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantAuthorizationForMediaItems(command);

      if (!result.success) {
        return {
          success: false,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      const { inviteeEmail, inviterName, albumTitle, tokenOrUserId, isPublicLink } = result.value;
      const inviteUrl = isPublicLink
        ? `${ctx.config.clientUrl}/shared/photos`
        : `${ctx.config.clientUrl}/albums/${tokenOrUserId}`;
      const template = (isPublicLink ? 'public-share' : 'share-invite') as keyof TemplateData;

      await ctx.notificationService.notify({
        to: inviteeEmail,
        template,
        data: {
          inviterName,
          resourceName: albumTitle,
          inviteUrl,
          signupUrl: `${ctx.config.clientUrl}/signup`,
        },
      });

      return {
        success: true,
        authorizationIds: result.value.authorizationIds,
        errors: [],
      };
    }),

    grantUserAuthorizationForAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationForAlbumCommand = {
        viewerId: ctx.viewer.id,
        albumId: args.input.albumId,
        operations: args.input.operations,
        grantedToHandle: args.input.grantedToHandle,
        label: args.input.label ?? undefined,
        expiresAt: args.input.expiresAt ?? undefined,
      };
      const result = await ctx.writeServices.grantUserAuthorizationForAlbum(command);

      if (!result.success) {
        return {
          success: false,
          errors: [toContractErrorPayload(result.error)],
        };
      }

      const { inviteeEmail, inviterName, albumTitle, tokenOrUserId, isPublicLink } = result.value;
      const inviteUrl = isPublicLink
        ? `${ctx.config.clientUrl}/shared/${tokenOrUserId}`
        : `${ctx.config.clientUrl}/albums/${tokenOrUserId}`;
      const template = (isPublicLink ? 'public-share' : 'share-invite') as keyof TemplateData;

      await ctx.notificationService.notify({
        to: inviteeEmail,
        template,
        data: {
          inviterName,
          resourceName: albumTitle,
          inviteUrl,
          signupUrl: `${ctx.config.clientUrl}/signup`,
        },
      });
      return {
        success: true,
        authorizationIds: result.value.authorizationIds,
        errors: [],
      };
    }),
  },
};

export default authorizationMutationResolvers;
