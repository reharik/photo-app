import { WriteResult } from '@packages/contracts';
import { GrantUserAuthorizationCommand } from '@packages/media-core';
import { TemplateData } from '@packages/notifications';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { GrantUserAuthorizationPayload, Resolvers } from '../../generated/types.generated';
import { toContractErrorPayload } from '../../mappers/contractErrorMapper';
import { writeResultToPayload } from '../../util/writeResultToPayload';

const authorizationMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    grantUserAuthorizationsForMediaItems: authenticatedWriteResolver(async (_parent, args, ctx) => {
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
        const inviteUrl = `${ctx.config.clientUrl}/albums/${emailDTO.tokenOrUserId}`;

        return ctx.notificationService.notify({
          to: emailDTO.inviteeEmail,
          template: emailDTO.template as keyof TemplateData,
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

    grantUserAuthorizationForAlbum: authenticatedWriteResolver(async (_parent, args, ctx) => {
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
        const inviteUrl = `${ctx.config.clientUrl}/albums/${emailDTO.tokenOrUserId}`;

        return ctx.notificationService.notify({
          to: emailDTO.inviteeEmail,
          template: emailDTO.template as keyof TemplateData,
          data: {
            inviterName: emailDTO.inviterName,
            resourceName: emailDTO.title,
            inviteUrl,
            signupUrl: `${ctx.config.clientUrl}/signup`,
          },
        });
      });
      const fu = await Promise.all(notifications);
      console.log(`************fu************`);
      console.log(JSON.stringify(fu, null, 4));
      console.log(`********END fu************`);
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
