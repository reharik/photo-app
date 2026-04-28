import type { IocGeneratedCradle } from '../../di/generated/ioc-registry.types';
import {
  GraphQLContext,
  GraphQLContextFactory,
  GraphQLInitialContext,
  ReadServices,
} from './types';

export const buildCreateGraphQLContext = ({
  writeServices,
  readServiceFactories,
  database,
  shareLinkReadRepository,
  albumReadRepository,
}: IocGeneratedCradle): GraphQLContextFactory => {
  return (initialContext: GraphQLInitialContext): GraphQLContext => {
    const base: GraphQLContext = {
      database,
      shareLinkReadRepository,
      albumReadRepository,
    };

    const user = initialContext.state?.user;
    if (!initialContext.state?.isLoggedIn || !user) {
      return base;
    }

    const viewer = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: `${user.firstName} ${user.lastName}`,
      isAuthenticated: true,
    };

    const rs = {} as ReadServices;

    for (const key of Object.keys(readServiceFactories) as Array<
      keyof typeof readServiceFactories
    >) {
      const serviceKey = key.replace(/Factory$/, '') as keyof ReadServices;
      (rs as Record<string, unknown>)[serviceKey] = readServiceFactories[key]({
        viewerId: viewer.id,
      });
    }

    return {
      ...base,
      viewer,
      writeServices,
      readServices: rs,
    };
  };
};
