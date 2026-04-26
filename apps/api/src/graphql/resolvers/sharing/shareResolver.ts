import { authenticatedResolver } from '../../context/authenticatedContext';
import type { Resolvers } from '../../generated/types.generated';

const shareResolvers: Pick<Resolvers, 'Query'> = {
  Query: {
    shareContacts: authenticatedResolver(async (_parent, _args, ctx) => {
      return ctx.readServices.viewerShareReadService.getShareContacts();
    }),
  },
};

export default shareResolvers;
