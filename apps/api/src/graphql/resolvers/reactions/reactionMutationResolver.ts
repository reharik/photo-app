import type { ToggleReactionCommand } from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { writeResultToPayload } from '../../util/writeResultToPayload';

const reactionMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    addReaction: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: ToggleReactionCommand = {
        ...args.input,
        viewer: ctx.viewer,
      };
      const result = await ctx.writeServices.toggleReaction(command);
      return writeResultToPayload(result);
    }),

    removeReaction: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: ToggleReactionCommand = {
        ...args.input,
        viewer: ctx.viewer,
      };
      const result = await ctx.writeServices.toggleReaction(command);
      return writeResultToPayload(result);
    }),
  },
};

export default reactionMutationResolvers;
