import { NotificationService } from '@packages/notifications';
import { Config } from '../../config';
import {
  GraphQLContextFactory,
  GraphQLInitialContext,
  InitialAuthenticated,
  InitialPublic,
} from './types';

type ContextDeps = {
  notificationService: NotificationService;
  config: Config;
};

export const build__CreateGraphQLContext = ({
  notificationService,
  config,
}: ContextDeps): GraphQLContextFactory => {
  return (initialContext: GraphQLInitialContext): InitialAuthenticated | InitialPublic => {
    const accessMode = initialContext.request.headers.get('X-Access-Mode') ?? undefined;
    const user = initialContext.state?.user;
    const publicAccessId = initialContext.state?.publicAccessId;

    if (accessMode === 'public') {
      if (!publicAccessId) {
        throw new Error('Public access not found');
      }
      return {
        kind: 'public',
        publicLinkId: publicAccessId,
        config,
      };
    }
    if (initialContext.state?.isLoggedIn && user) {
      const viewer = { ...user, displayName: `${user.firstName} ${user.lastName}` };
      return {
        kind: 'authenticated',
        viewer,
        notificationService,
        config,
      };
    }
    throw new Error('Invalid access mode');
  };
};
