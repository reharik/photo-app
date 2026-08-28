import { User } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type {
  AgnosticReadServices,
  PublicReadServices,
  ReadServices,
  WriteServices,
} from '@packages/media-core/iocTypes';
import type { YogaInitialContext } from 'graphql-yoga';
import type Koa from 'koa';
import type { Config } from '../../config';

// ── stage 1: pre-scope, what createContext produces ─────────
export interface InitialAuthenticated {
  kind: 'authenticated'; // literal — no read/write yet, correctly
  viewer: User;
  config: Config;
  logger: Logger;
}
export interface InitialPublic {
  kind: 'public';
  publicLinkId: string;
  config: Config;
  logger: Logger;
}
export type InitialGraphQLContext = InitialAuthenticated | InitialPublic;

// ── what the SCOPE contributes — this is the ScopeRoot contract now ──
export interface AuthenticatedReadScopeServices {
  readServices: ReadServices;
  agnosticReadServices: AgnosticReadServices;
  finalize: (transportOk: boolean) => Promise<void>;
}
export interface AuthenticatedWriteScopeServices {
  readServices: ReadServices;
  agnosticReadServices: AgnosticReadServices;
  writeServices: WriteServices;

  flagFailure: () => void;
  finalize: (transportOk: boolean) => Promise<void>;
}

export interface PublicReadScopeServices {
  publicReadServices: PublicReadServices;
  agnosticReadServices: AgnosticReadServices;
  finalize: (transportOk: boolean) => Promise<void>;
}

// ── stage 2: post-scope, what resolvers see ─────────────────
export interface AuthenticatedReadGraphQLContext
  extends Omit<InitialAuthenticated, 'kind'>, AuthenticatedReadScopeServices {
  kind: 'authenticatedRead';
}
export interface AuthenticatedWriteGraphQLContext
  extends Omit<InitialAuthenticated, 'kind'>, AuthenticatedWriteScopeServices {
  kind: 'authenticatedWrite';
}
export interface PublicReadGraphQLContext
  extends Omit<InitialPublic, 'kind'>, PublicReadScopeServices {
  kind: 'publicRead'; // renamed — no collision with stage-1 'public'
}

export type GraphQLContext =
  AuthenticatedReadGraphQLContext | AuthenticatedWriteGraphQLContext | PublicReadGraphQLContext;
export type GraphQLInitialContext = YogaInitialContext & Koa.Context;

export interface GraphQLContextFactory {
  (initialContext: GraphQLInitialContext): InitialAuthenticated | InitialPublic;
}
