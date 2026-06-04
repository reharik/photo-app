import { User } from '@packages/contracts';
import { asValue, AwilixContainer } from 'awilix';
import { Cradle } from '../../container';
import {
  AuthenticatedGraphQLContext,
  GraphQLContextFactory,
  GraphQLInitialContext,
  PublicGraphQLContext,
} from './types';

type ContextDeps = {
  container: AwilixContainer<Cradle>;
};
type PublicContextDeps = {
  scope: AwilixContainer<Cradle>;
};
type AuthenticatedContextDeps = {
  scope: AwilixContainer<Cradle>;
  user: User;
};

export const build__CreateGraphQLContext = ({ container }: ContextDeps): GraphQLContextFactory => {
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
      });
    }
    if (initialContext.state?.isLoggedIn && user) {
      scope.register({ viewerId: asValue(user.id) });
      return buildAuthenticatedContext({
        scope,
        user,
      });
    }
    throw new Error('Invalid access mode');
  };
};

const buildAuthenticatedContext = ({
  scope,
  user,
}: AuthenticatedContextDeps): AuthenticatedGraphQLContext => {
  const viewer = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: `${user.firstName} ${user.lastName}`,
    isAuthenticated: true,
  };
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
  };
};

const buildPublicContext = ({ scope }: PublicContextDeps): PublicGraphQLContext => {
  const publicReadServices = scope.resolve('publicReadServices');
  const agnosticReadServices = scope.resolve('agnosticReadServices');
  const publicLinkId = scope.resolve('publicLinkId');

  return {
    kind: 'public',
    publicReadServices,
    publicLinkId,
    agnosticReadServices,
  };
};
