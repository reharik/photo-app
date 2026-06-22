import { WriteResult } from '@packages/contracts';
import { GrantUserAuthorizationCommand } from '@packages/media-core';
import { TemplateData } from '@packages/notifications';
import { authenticatedResolver } from '../../context/contextWrappers';
import type { GrantUserAuthorizationPayload, Resolvers } from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';
import { writeResultToPayload } from '../../util/writeResultToPayload';

const authorizationMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    grantUserAuthorizationsForMediaItems: authenticatedResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationCommand = {
        viewerId: ctx.viewer.id,
        entityIds: args.input.mediaItemIds,
        operations: args.input.operations,
        grantedToHandles: args.input.grantedToHandles,
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
      const notifications = result.value.emailDTOs.map((emailDTO) => {
        const inviteUrl = emailDTO.isPublicLink
          ? `${ctx.config.clientUrl}/shared/photos`
          : `${ctx.config.clientUrl}/albums/${emailDTO.tokenOrUserId}`;
        const template = (
          emailDTO.isPublicLink ? 'publicShare' : 'shareInvite'
        ) as keyof TemplateData;

        return ctx.notificationService.notify({
          to: emailDTO.inviteeEmail,
          template,
          data: {
            inviterName: emailDTO.inviterName,
            resourceName: emailDTO.title,
            inviteUrl,
            signupUrl: `${ctx.config.clientUrl}/signup`,
          },
        });
      });
      await Promise.all(notifications);
      return {
        success: true,
        authorizationIds: result.value.authorizations.map((authorization) => authorization.id()),
        errors: [],
      };
    }),

    grantUserAuthorizationForAlbum: authenticatedResolver(async (_parent, args, ctx) => {
      const command: GrantUserAuthorizationCommand = {
        viewerId: ctx.viewer.id,
        entityIds: [args.input.albumId],
        operations: args.input.operations,
        grantedToHandles: args.input.grantedToHandles,
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

      const notifications = result.value.emailDTOs.map((emailDTO) => {
        const inviteUrl = emailDTO.isPublicLink
          ? `${ctx.config.clientUrl}/shared/${emailDTO.tokenOrUserId}`
          : `${ctx.config.clientUrl}/albums/${emailDTO.tokenOrUserId}`;
        const template = (
          emailDTO.isPublicLink ? 'publicShare' : 'shareInvite'
        ) as keyof TemplateData;

        return ctx.notificationService.notify({
          to: emailDTO.inviteeEmail,
          template,
          data: {
            inviterName: emailDTO.inviterName,
            resourceName: emailDTO.title,
            inviteUrl,
            signupUrl: `${ctx.config.clientUrl}/signup`,
          },
        });
      });
      await Promise.all(notifications);

      const resultPayload: WriteResult<GrantUserAuthorizationPayload> = {
        success: true,
        value: {
          authorizationIds: result.value.authorizations.map((authorization) => authorization.id()),
        },
      };
      return writeResultToPayload(resultPayload);
    }),
  },
};

export default authorizationMutationResolvers;
