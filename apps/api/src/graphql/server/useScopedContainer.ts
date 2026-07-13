import { beginUnitOfWorkScope, endUnitOfWork } from '@packages/media-core';
import { asValue, AwilixContainer } from 'awilix';
import { DocumentNode, Kind, OperationDefinitionNode } from 'graphql';
import { isAsyncIterable, type Plugin } from 'graphql-yoga';
import { Cradle } from '../../container';
import {
  AuthenticatedReadGraphQLContext,
  AuthenticatedWriteGraphQLContext,
  InitialAuthenticated,
  InitialPublic,
  PublicGraphQLContext,
} from '../context/types';

export const useScopedContainer = (
  container: AwilixContainer<Cradle>,
): Plugin<
  AuthenticatedReadGraphQLContext | AuthenticatedWriteGraphQLContext | PublicGraphQLContext
> => {
  return {
    async onExecute({ args, extendContext }) {
      const op = getOperationType(args.document, args.operationName);
      if (op !== 'mutation') {
        const scope = container.createScope();
        const readContext = createReadContext(args.contextValue, scope);
        extendContext(readContext);
        return;
      }

      const { scope, unitOfWork } = await beginUnitOfWorkScope(container);
      const writeServices = scope.resolve('writeServices');
      // Thread the same uow instance into the context so authenticatedWriteResolver can
      // flag it for rollback on a failed WriteResult; the predicate below reads it back.
      extendContext({ writeServices, uow: unitOfWork, kind: 'authenticatedWrite' });

      return {
        async onExecuteDone({ result }) {
          if (isAsyncIterable(result)) {
            // streaming (defer/stream/subscription) — not your mutation case
            // commit or rollback? see note below
            return;
          }
          // result is now narrowed to SingleExecutionResult — .errors works.
          // Commit only if there was NO GraphQL error AND no mutation field flagged the
          // uow for rollback. Failures travel as data in the payload (fail-as-data), so
          // they never reach result.errors — authenticatedWriteResolver detects them and
          // sets uow.shouldRollback. Any single failed field rolls back the whole request.
          await endUnitOfWork(unitOfWork, !result.errors?.length && !unitOfWork.shouldRollback);
        },
      };
    },
  };
};

const createReadContext = (
  context: InitialAuthenticated | InitialPublic,
  scope: AwilixContainer<Cradle>,
): AuthenticatedReadGraphQLContext | PublicGraphQLContext => {
  if (context.kind === 'authenticated') {
    scope.register({ viewerId: asValue(context.viewer.id) });
    const readServices = scope.resolve('readServices');
    const agnosticReadServices = scope.resolve('agnosticReadServices');
    return { ...context, readServices, agnosticReadServices, kind: 'authenticatedRead' };
  }
  if (context.kind !== 'public') {
    throw new Error('Not public');
  }
  scope.register({ publicLinkId: asValue(context.publicLinkId) });
  return {
    ...context,
    publicReadServices: scope.resolve('publicReadServices'),
    agnosticReadServices: scope.resolve('agnosticReadServices'),
  };
};

const getOperationType = (
  document: DocumentNode,
  operationName?: string,
): 'query' | 'mutation' | 'subscription' | undefined => {
  const def = document.definitions.find(
    (d): d is OperationDefinitionNode =>
      d.kind === Kind.OPERATION_DEFINITION &&
      (operationName ? d.name?.value === operationName : true),
  );
  return def?.operation;
};
