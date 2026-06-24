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
      extendContext({ writeServices, kind: 'authenticatedWrite' });

      return {
        async onExecuteDone({ result }) {
          if (isAsyncIterable(result)) {
            // streaming (defer/stream/subscription) — not your mutation case
            // commit or rollback? see note below
            return;
          }
          // result is now narrowed to SingleExecutionResult — .errors works
          await endUnitOfWork(unitOfWork, !result.errors?.length);
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
