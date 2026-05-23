import type { StripFactory } from '@packages/media-core';
import type { IocGeneratedCradle as MediaCoreCradle } from '@packages/media-core/iocTypes';
import type { YogaInitialContext } from 'graphql-yoga';
import type { Knex } from 'knex';
import type Koa from 'koa';

export type ReadServiceFactories = MediaCoreCradle['readServiceFactories'];
export type PublicReadServiceFactories = MediaCoreCradle['publicReadServiceFactories'];
export type WriteServices = MediaCoreCradle['writeServices'];
export type AgnosticReadServices = MediaCoreCradle['agnosticReadServices'];

export type ReadServices = StripFactory<ReadServiceFactories>;
export type PublicReadServices = StripFactory<PublicReadServiceFactories>;

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
  writeServices: WriteServices;
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
