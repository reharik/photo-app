import { User } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type { UnitOfWork } from '@packages/media-core';
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
  config: Config;
  logger: Logger;
};

export type AuthenticatedReadGraphQLContext = InitialAuthenticated & {
  readServices: ReadServices;
  agnosticReadServices: AgnosticReadServices;
};

export type AuthenticatedWriteGraphQLContext = InitialAuthenticated & {
  writeServices: WriteServices;
  // The per-request unit of work, threaded in so the write-resolver wrapper can flag
  // it for rollback when a mutation returns a failed WriteResult (fail-as-data). Same
  // instance the boundary (useScopedContainer) reads at commit time.
  uow: UnitOfWork;
};

export type PublicGraphQLContext = InitialPublic & {
  publicReadServices: PublicReadServices;
  agnosticReadServices: AgnosticReadServices;
};

export type InitialPublic = GraphQLContextShared & {
  kind: 'public';
  publicLinkId: string;
};

export type InitialAuthenticated = GraphQLContextShared & {
  kind: 'authenticated' | 'authenticatedRead' | 'authenticatedWrite';
  viewer: User;
  notificationService: NotificationService;
};

export type GraphQLContext =
  | AuthenticatedReadGraphQLContext
  | AuthenticatedWriteGraphQLContext
  | PublicGraphQLContext;

export type GraphQLInitialContext = YogaInitialContext & Koa.Context;

export interface GraphQLContextFactory {
  (initialContext: GraphQLInitialContext): InitialAuthenticated | InitialPublic;
}
