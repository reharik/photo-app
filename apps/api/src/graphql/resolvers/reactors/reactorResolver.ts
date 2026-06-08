import { Resolvers } from '../../generated/types.generated';
export const reactorResolvers: Resolvers = {
  Reactor: {
    isViewer: (parent, args, context) => parent.userId === context.viewer?.id,
  },
};
