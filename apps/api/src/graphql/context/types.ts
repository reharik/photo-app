import { User } from '@packages/contracts';
import type { AlbumReadRepository, ShareLinkReadRepository } from '@packages/media-core';
import { StripFactory } from '@packages/media-core';
import type { YogaInitialContext } from 'graphql-yoga';
import type { Knex } from 'knex';
import type Koa from 'koa';
import { IocGeneratedTypes } from '../../di/generated/ioc-registry.types';

export type ReadServices = StripFactory<IocGeneratedTypes['readServiceFactories']>;

export type GraphQLContextViewer = {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  isAuthenticated: boolean;
};

export interface GraphQLContext {
  database: Knex;
  shareLinkReadRepository: ShareLinkReadRepository;
  albumReadRepository: AlbumReadRepository;
  viewer?: GraphQLContextViewer;
  writeServices?: IocGeneratedTypes['writeServices'];
  readServices?: ReadServices;
}

export type AuthenticatedGraphQLContext = GraphQLContext & {
  viewer: GraphQLContextViewer;
  writeServices: IocGeneratedTypes['writeServices'];
  readServices: ReadServices;
};

export type GraphQLInitialContext = YogaInitialContext &
  Koa.Context & { state: { isLoggedIn: boolean; user: User } };

export interface GraphQLContextFactory {
  (initialContext: GraphQLInitialContext): GraphQLContext;
}
