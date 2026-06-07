import { User } from '@packages/contracts';
import type { YogaInitialContext } from 'graphql-yoga';
import type Koa from 'koa';
import type { AppCradle } from '../../di/generated/ioc-composed';

type PublicReadServices = AppCradle['publicReadServices'];
type ReadServices = AppCradle['readServices'];
type WriteServices = AppCradle['writeServices'];
type AgnosticReadServices = AppCradle['agnosticReadServices'];

type GraphQLContextShared = {
  agnosticReadServices: AgnosticReadServices;
};

export type AuthenticatedGraphQLContext = GraphQLContextShared & {
  kind: 'authenticated';
  viewer: User;
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
