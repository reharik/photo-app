import type { Resolvers } from '../../generated/types.generated';

const reactionFieldResolvers: Resolvers = {
  MediaItem: {
    reactionCount: (parent) => {
      return (parent as unknown as { reactionCount: number }).reactionCount ?? 0;
    },
    viewerHasReacted: async (parent, _args, ctx) => {
      if (ctx.kind !== 'authenticated') {
        return false;
      }
      const id = (parent as unknown as { id: string }).id;
      return ctx.viewerHasReactedLoader.load(`mediaItem:${id}`);
    },
  },

  Comment: {
    reactionCount: (parent) => {
      return (parent as unknown as { reactionCount: number }).reactionCount ?? 0;
    },
    viewerHasReacted: async (parent, _args, ctx) => {
      if (ctx.kind !== 'authenticated') {
        return false;
      }
      const id = (parent as unknown as { id: string }).id;
      return ctx.viewerHasReactedLoader.load(`comment:${id}`);
    },
  },

  PublicMediaItem: {
    reactionCount: (parent) => {
      return (parent as unknown as { reactionCount: number }).reactionCount ?? 0;
    },
  },
};

export default reactionFieldResolvers;
