import { User } from '@packages/contracts';
import { Knex } from 'knex';
import type { IocGeneratedCradle } from '../../di/generated/ioc-registry.types';
import {
  AuthenticatedGraphQLContext,
  GraphQLContextFactory,
  GraphQLInitialContext,
  PublicGraphQLContext,
  PublicReadServices,
  ReadServices,
} from './types';

type ContextDeps = {
  publicReadServiceFactories: IocGeneratedCradle['publicReadServiceFactories'];
  publicAccessReadService: IocGeneratedCradle['publicAccessReadService'];
  writeServices: IocGeneratedCradle['writeServices'];
  readServiceFactories: IocGeneratedCradle['readServiceFactories'];
  database: Knex;
};
type PublicContextDeps = {
  publicReadServiceFactories: IocGeneratedCradle['publicReadServiceFactories'];
  publicAccessReadService: IocGeneratedCradle['publicAccessReadService'];
  database: Knex;
  publicLinkId: string;
};
type AuthenticatedContextDeps = {
  user: User;
  readServiceFactories: IocGeneratedCradle['readServiceFactories'];
  database: Knex;
  writeServices: IocGeneratedCradle['writeServices'];
};

export const build__CreateGraphQLContext = ({
  writeServices,
  readServiceFactories,
  publicReadServiceFactories,
  publicAccessReadService,
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
      publicAccessReadService,
    });
  };
};

const buildAuthenticatedContext = ({
  user,
  readServiceFactories,
  database,
  writeServices,
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
    database,
    viewer,
    writeServices,
    readServices: rs,
  };
};

const buildPublicContext = ({
  publicReadServiceFactories,
  publicAccessReadService,
  database,
  publicLinkId,
}: PublicContextDeps): PublicGraphQLContext => {
  type PublicServiceFactory = (deps: { publicLinkId: string }) => unknown;

  const publicReadServices = Object.fromEntries(
    Object.entries(publicReadServiceFactories).map(([key, factory]) => [
      key.replace(/Factory$/, ''),
      (factory as PublicServiceFactory)({ publicLinkId }),
    ]),
  ) as PublicReadServices;

  return {
    database,
    publicReadServices,
    publicAccessReadService,
    publicLinkId,
  };
};
