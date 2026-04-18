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
}: IocGeneratedCradle): GraphQLContextFactory => {
  return (initialContext: GraphQLInitialContext): GraphQLContext => {
    const user = initialContext.state?.user;
    if (!initialContext.state?.isLoggedIn || !user) {
      return {};
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
      viewer,
      writeServices,
      readServices: rs,
    };
  };
};
