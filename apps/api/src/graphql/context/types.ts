import { User } from '@packages/contracts';
import type { PublicAccessReadService, PublicAccessRow, StripFactory } from '@packages/media-core';
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
  /** Present for public (share-link) operations; link id is also on `publicAccess`. */
  publicAccess?: PublicAccessRow;
  publicAccessReadService?: PublicAccessReadService;
  publicLinkId?: string;
}

export type AuthenticatedGraphQLContext = GraphQLContext & {
  viewer: GraphQLContextViewer;
  writeServices: IocGeneratedTypes['writeServices'];
  readServices: ReadServices;
};

export type PublicGraphQLContext = GraphQLContext & {
  publicReadServices: PublicReadServices;
  publicAccessReadService: PublicAccessReadService;
  publicLinkId: string;
};

export type GraphQLInitialContext = YogaInitialContext &
  Koa.Context & {
    state: { isLoggedIn: boolean; user?: User; publicAccess?: PublicAccessRow };
  };

export interface GraphQLContextFactory {
  (initialContext: GraphQLInitialContext): AuthenticatedGraphQLContext | PublicGraphQLContext;
}
