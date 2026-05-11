import type { StripFactory } from '@packages/media-core';
import type { YogaInitialContext } from 'graphql-yoga';
import type { Knex } from 'knex';
import type Koa from 'koa';
import { IocGeneratedTypes } from '../../di/generated/ioc-registry.types';

export type ReadServices = StripFactory<IocGeneratedTypes['readServiceFactories']>;
export type PublicReadServices = StripFactory<IocGeneratedTypes['publicReadServiceFactories']>;
export type AgnosticReadServices = IocGeneratedTypes['agnosticReadServices'];

export type GraphQLContextViewer = {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  isAuthenticated: boolean;
};

type GraphQLContextShared = {
  database: Knex;
  agnosticReadServices: AgnosticReadServices;
};

export type AuthenticatedGraphQLContext = GraphQLContextShared & {
  kind: 'authenticated';
  viewer: GraphQLContextViewer;
  writeServices: IocGeneratedTypes['writeServices'];
  readServices: ReadServices;
};

export type PublicGraphQLContext = GraphQLContextShared & {
  kind: 'public';
  publicReadServices: PublicReadServices;
  publicLinkId: string;
};

export type GraphQLContext = AuthenticatedGraphQLContext | PublicGraphQLContext;

export type GraphQLInitialContext = YogaInitialContext & Koa.Context;

export interface GraphQLContextFactory {
  (initialContext: GraphQLInitialContext): AuthenticatedGraphQLContext | PublicGraphQLContext;
}
