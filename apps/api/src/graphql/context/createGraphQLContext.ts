import { User } from '@packages/contracts';
import { NotificationService } from '@packages/notifications';
import { asValue, AwilixContainer } from 'awilix';
import { Config } from '../../config';
import { Cradle } from '../../container';
import {
  AuthenticatedGraphQLContext,
  GraphQLContextFactory,
  GraphQLInitialContext,
  PublicGraphQLContext,
} from './types';

type ContextDeps = {
  container: AwilixContainer<Cradle>;
  notificationService: NotificationService;
  config: Config;
};
type PublicContextDeps = {
  scope: AwilixContainer<Cradle>;
  config: Config;
};
type AuthenticatedContextDeps = {
  scope: AwilixContainer<Cradle>;
  user: User;
  notificationService: NotificationService;
  config: Config;
};

export const build__CreateGraphQLContext = ({
  container,
  notificationService,
  config,
}: ContextDeps): GraphQLContextFactory => {
  return (
    initialContext: GraphQLInitialContext,
  ): AuthenticatedGraphQLContext | PublicGraphQLContext => {
    const scope = container.createScope();
    const accessMode = initialContext.request.headers.get('X-Access-Mode') ?? undefined;
    const user = initialContext.state?.user;
    const publicAccessId = initialContext.state?.publicAccessId;

    if (accessMode === 'public') {
      if (!publicAccessId) {
        throw new Error('Public access not found');
      }
      scope.register({ publicLinkId: asValue(publicAccessId) });
      return buildPublicContext({
        scope,
        config,
      });
    }
    if (initialContext.state?.isLoggedIn && user) {
      scope.register({ viewerId: asValue(user.id) });
      return buildAuthenticatedContext({
        scope,
        user,
        notificationService,
        config,
      });
    }
    throw new Error('Invalid access mode');
  };
};

const buildAuthenticatedContext = ({
  scope,
  user,
  notificationService,
  config,
}: AuthenticatedContextDeps): AuthenticatedGraphQLContext => {
  const viewer = { ...user, displayName: `${user.firstName} ${user.lastName}` };
  scope.register({ viewer: asValue(viewer) });
  const readServices = scope.resolve('readServices');
  const agnosticReadServices = scope.resolve('agnosticReadServices');
  const writeServices = scope.resolve('writeServices');

  return {
    kind: 'authenticated',
    viewer,
    writeServices,
    readServices,
    agnosticReadServices,
    notificationService,
    config,
  };
};

const buildPublicContext = ({ scope, config }: PublicContextDeps): PublicGraphQLContext => {
  const publicReadServices = scope.resolve('publicReadServices');
  const agnosticReadServices = scope.resolve('agnosticReadServices');
  const publicLinkId = scope.resolve('publicLinkId');

  return {
    kind: 'public',
    publicReadServices,
    publicLinkId,
    agnosticReadServices,
    config,
  };
};
