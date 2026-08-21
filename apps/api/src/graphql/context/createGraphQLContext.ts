import { toDisplayName } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { NotificationService } from '@packages/notifications';
import { Config } from '../../config';
import { GraphQLContextFactory, GraphQLInitialContext, InitialGraphQLContext } from './types';

type ContextDeps = {
  notificationService: NotificationService;
  config: Config;
  logger: Logger;
};

export const build__CreateGraphQLContext = ({
  config,
  logger,
}: ContextDeps): GraphQLContextFactory => {
  return (initialContext: GraphQLInitialContext): InitialGraphQLContext => {
    const accessMode = initialContext.request.headers.get('X-Access-Mode') ?? undefined;
    const user = initialContext.state?.user;
    const publicAccessId = initialContext.state?.publicAccessId;

    if (accessMode === 'public') {
      if (!publicAccessId) {
        logger.warn('GraphQL context rejected: public access mode with no publicAccessId', {
          accessMode,
          isLoggedIn: initialContext.state?.isLoggedIn ?? false,
        });
        throw new Error('Public access not found');
      }
      return {
        kind: 'public',
        publicLinkId: publicAccessId,
        config,
        logger,
      };
    }
    if (initialContext.state?.isLoggedIn && user) {
      const viewer = { ...user, displayName: toDisplayName(user) };
      return {
        kind: 'authenticated',
        viewer,
        config,
        logger,
      };
    }
    logger.warn('GraphQL context rejected: no valid access mode', {
      accessMode: accessMode ?? '(none)',
      isLoggedIn: initialContext.state?.isLoggedIn ?? false,
      hasUser: Boolean(user),
    });
    throw new Error('Invalid access mode');
  };
};
