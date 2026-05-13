import type { AddReactionCommand, RemoveReactionCommand } from '@packages/media-core';
import { authenticatedResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { writeResultToPayload } from '../../util/writeResultToPayload';

const reactionMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    addReaction: authenticatedResolver(async (_parent, args, ctx) => {
      const command: AddReactionCommand = {
        ...args.input,
        viewer: { userId: ctx.viewer.id },
      };

      const result = await ctx.writeServices.addReaction(command);
      return writeResultToPayload(result);
    }),

    removeReaction: authenticatedResolver(async (_parent, args, ctx) => {
      const command: RemoveReactionCommand = {
        ...args.input,
        viewer: { userId: ctx.viewer.id },
      };

      const result = await ctx.writeServices.removeReaction(command);
      return writeResultToPayload(result);
    }),
  },
};

export default reactionMutationResolvers;
