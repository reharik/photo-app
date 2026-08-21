// ── factories/requestContext.ts ── the scope roots ──────────
import { EntityId, UnitOfWork } from '@packages/media-core';
import {
  AgnosticReadServices,
  PublicReadServices,
  ReadServices,
  WriteServices,
} from '@packages/media-core/iocTypes';
import { ScopeRoot } from 'ioc-manifest';
import {
  AuthenticatedReadScopeServices,
  AuthenticatedWriteScopeServices,
  PublicReadScopeServices,
} from './types';

type AuthedDeps = {
  readServices: ReadServices;
  agnosticReadServices: AgnosticReadServices;
  writeServices: WriteServices;
  uow: UnitOfWork; // scoped sibling, injected normally
};

export const build__AuthenticatedReadGraphQLContext = ({
  readServices,
  agnosticReadServices,
}: AuthedDeps): ScopeRoot<AuthenticatedReadScopeServices, { viewerId: EntityId }> => ({
  readServices: readServices,
  agnosticReadServices: agnosticReadServices,
});

export const build__AuthenticatedWriteGraphQLContext = ({
  readServices,
  agnosticReadServices,
  writeServices,
  uow,
}: AuthedDeps): ScopeRoot<AuthenticatedWriteScopeServices, { viewerId: EntityId }> => ({
  readServices: readServices,
  agnosticReadServices: agnosticReadServices,
  writeServices: writeServices,
  start: uow.start,
  flagFailure: () => {
    uow.flagRollback();
  },
  finalize: uow.complete,
});

type PublicDeps = {
  publicReadServices: PublicReadServices;
  agnosticReadServices: AgnosticReadServices;
};

export const build__PublicRequestContext = ({
  publicReadServices,
  agnosticReadServices,
}: PublicDeps): ScopeRoot<PublicReadScopeServices, { publicLinkId: string }> => ({
  publicReadServices: publicReadServices,
  agnosticReadServices: agnosticReadServices,
});
