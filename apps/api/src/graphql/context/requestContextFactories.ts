// ── factories/requestContext.ts ── the scope roots ──────────
import { EntityId } from '@packages/contracts';
import { UnitOfWork } from '@packages/media-core';
import {
  AgnosticReadServices,
  PublicReadServices,
  ReadServices,
  WriteServices,
} from '@packages/media-core/iocTypes';
import { ScopeRoot } from 'ioc-manifest';
import { LogContext } from '../../types/logContext';
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
  uow,
}: AuthedDeps): ScopeRoot<
  AuthenticatedReadScopeServices,
  { viewerId: EntityId; logContext: LogContext }
> => ({
  readServices: readServices,
  agnosticReadServices: agnosticReadServices,
  finalize: uow.complete,
  start: uow.start,
});

export const build__AuthenticatedWriteGraphQLContext = ({
  readServices,
  agnosticReadServices,
  writeServices,
  uow,
}: AuthedDeps): ScopeRoot<
  AuthenticatedWriteScopeServices,
  { viewerId: EntityId; logContext: LogContext }
> => ({
  readServices: readServices,
  agnosticReadServices: agnosticReadServices,
  writeServices: writeServices,
  flagFailure: () => {
    uow.flagRollbackOnly();
  },
  finalize: uow.complete,
  start: uow.start,
});

type PublicDeps = {
  publicReadServices: PublicReadServices;
  agnosticReadServices: AgnosticReadServices;
  uow: UnitOfWork;
};

export const build__PublicRequestContext = ({
  publicReadServices,
  agnosticReadServices,
  uow,
}: PublicDeps): ScopeRoot<
  PublicReadScopeServices,
  { publicLinkId: string; logContext: LogContext }
> => ({
  publicReadServices: publicReadServices,
  agnosticReadServices: agnosticReadServices,
  finalize: uow.complete,
  start: uow.start,
});
