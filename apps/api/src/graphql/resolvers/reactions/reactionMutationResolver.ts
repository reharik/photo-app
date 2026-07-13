import type { ToggleReactionCommand } from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const reactionMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    addReaction: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: ToggleReactionCommand = {
        ...args.input,
        viewer: ctx.viewer,
      };
      return ctx.writeServices.toggleReaction(command);
    }),

    removeReaction: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: ToggleReactionCommand = {
        ...args.input,
        viewer: ctx.viewer,
      };
      return ctx.writeServices.toggleReaction(command);
    }),
  },
};

export default reactionMutationResolvers;
