import { User } from '@packages/contracts';
import { Knex } from 'knex';
import {
  AgnosticReadServices,
  AuthenticatedGraphQLContext,
  GraphQLContextFactory,
  GraphQLInitialContext,
  PublicGraphQLContext,
  PublicReadServiceFactories,
  PublicReadServices,
  ReadServiceFactories,
  ReadServices,
  WriteServices,
} from './types';

type ContextDeps = {
  publicReadServiceFactories: PublicReadServiceFactories;
  agnosticReadServices: AgnosticReadServices;
  writeServices: WriteServices;
  readServiceFactories: ReadServiceFactories;
  database: Knex;
};
type PublicContextDeps = {
  publicReadServiceFactories: PublicReadServiceFactories;
  agnosticReadServices: AgnosticReadServices;
  database: Knex;
  publicLinkId: string;
};
type AuthenticatedContextDeps = {
  user: User;
  readServiceFactories: ReadServiceFactories;
  database: Knex;
  writeServices: WriteServices;
  agnosticReadServices: AgnosticReadServices;
};

export const build__CreateGraphQLContext = ({
  writeServices,
  readServiceFactories,
  publicReadServiceFactories,
  agnosticReadServices,
  database,
}: ContextDeps): GraphQLContextFactory => {
  return (
    initialContext: GraphQLInitialContext,
  ): AuthenticatedGraphQLContext | PublicGraphQLContext => {
    const user = initialContext.state?.user;
    const publicAccessId = initialContext.state?.publicAccessId;
    if (initialContext.state?.isLoggedIn && user) {
      return buildAuthenticatedContext({
        user,
        readServiceFactories,
        database,
        writeServices,
        agnosticReadServices,
      });
    }
    if (!publicAccessId) {
      throw new Error('Public access not found');
    }
    return buildPublicContext({
      publicReadServiceFactories,
      database,
      // Rename/map here for clarity down the line
      publicLinkId: publicAccessId,
      agnosticReadServices,
    });
  };
};

const buildAuthenticatedContext = ({
  user,
  readServiceFactories,
  database,
  writeServices,
  agnosticReadServices,
}: AuthenticatedContextDeps): AuthenticatedGraphQLContext => {
  const viewer = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: `${user.firstName} ${user.lastName}`,
    isAuthenticated: true,
  };

  type ServiceFactory = (deps: { viewerId: string }) => unknown;
  const rs = Object.fromEntries(
    Object.entries(readServiceFactories).map(([key, factory]) => [
      key.replace(/Factory$/, ''),
      (factory as ServiceFactory)({ viewerId: viewer.id }),
    ]),
  ) as ReadServices;

  return {
    kind: 'authenticated',
    database,
    viewer,
    writeServices,
    readServices: rs,
    agnosticReadServices,
  };
};

const buildPublicContext = ({
  publicReadServiceFactories,
  database,
  publicLinkId,
  agnosticReadServices,
}: PublicContextDeps): PublicGraphQLContext => {
  type PublicServiceFactory = (deps: { publicLinkId: string }) => unknown;

  const publicReadServices = Object.fromEntries(
    Object.entries(publicReadServiceFactories).map(([key, factory]) => [
      key.replace(/Factory$/, ''),
      (factory as PublicServiceFactory)({ publicLinkId }),
    ]),
  ) as PublicReadServices;

  return {
    kind: 'public',
    database,
    publicReadServices,
    publicLinkId,
    agnosticReadServices,
  };
};
