import { User } from '@packages/contracts';
import { PublicAccessProjection, StripFactory } from '@packages/media-core';
import type { YogaInitialContext } from 'graphql-yoga';
import type { Knex } from 'knex';
import type Koa from 'koa';
import { IocGeneratedTypes } from '../../di/generated/ioc-registry.types';

export type ReadServices = StripFactory<IocGeneratedTypes['readServiceFactories']>;
export type PublicReadServices = StripFactory<IocGeneratedTypes['publicReadServiceFactories']>;

export type GraphQLContextViewer = {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  isAuthenticated: boolean;
};

export interface GraphQLContext {
  database: Knex;
  viewer?: GraphQLContextViewer;
  writeServices?: IocGeneratedTypes['writeServices'];
  readServices?: ReadServices;
  publicReadServices?: PublicReadServices;
  publicLinkId?: string;
}

export type AuthenticatedGraphQLContext = GraphQLContext & {
  viewer: GraphQLContextViewer;
  writeServices: IocGeneratedTypes['writeServices'];
  readServices: ReadServices;
};

export type PublicGraphQLContext = GraphQLContext & {
  publicReadServices: PublicReadServices;
  publicAccess: PublicAccessProjection;
};

export type GraphQLInitialContext = YogaInitialContext &
  Koa.Context & {
    state: { isLoggedIn: boolean; user?: User; publicAccess?: PublicAccessProjection };
  };

export interface GraphQLContextFactory {
  (initialContext: GraphQLInitialContext): AuthenticatedGraphQLContext | PublicGraphQLContext;
}
