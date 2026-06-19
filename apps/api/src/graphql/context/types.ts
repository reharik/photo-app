import { User } from '@packages/contracts';
import type { NotificationService } from '@packages/notifications';
import type { YogaInitialContext } from 'graphql-yoga';
import type Koa from 'koa';
import type { Config } from '../../config';
import type { AppCradle } from '../../di/generated/ioc-composed';

type PublicReadServices = AppCradle['publicReadServices'];
type ReadServices = AppCradle['readServices'];
type WriteServices = AppCradle['writeServices'];
type AgnosticReadServices = AppCradle['agnosticReadServices'];

type GraphQLContextShared = {
  agnosticReadServices: AgnosticReadServices;
  config: Config;
};

export type AuthenticatedGraphQLContext = GraphQLContextShared & {
  kind: 'authenticated';
  viewer: User;
  writeServices: WriteServices;
  readServices: ReadServices;
  notificationService: NotificationService;
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
