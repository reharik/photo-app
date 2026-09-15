import { DocumentNode, Kind, OperationDefinitionNode } from 'graphql';
import { isAsyncIterable, type Plugin } from 'graphql-yoga';
import {
  OpenAuthenticatedReadGraphQlContextScope,
  OpenAuthenticatedWriteGraphQlContextScope,
  OpenPublicRequestContextScope,
} from '../../di/generated/ioc-registry.types';
import { LogContext } from '../../types/logContext';
import {
  AuthenticatedReadGraphQLContext,
  AuthenticatedWriteGraphQLContext,
  GraphQLContext,
  InitialGraphQLContext,
  PublicReadGraphQLContext,
} from '../context/types';

type UseScopedContainerDeps = {
  openAuthenticatedReadGraphQlContextScope: OpenAuthenticatedReadGraphQlContextScope;
  openAuthenticatedWriteGraphQlContextScope: OpenAuthenticatedWriteGraphQlContextScope;
  openPublicRequestContextScope: OpenPublicRequestContextScope;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseScopedContainer extends Plugin<InitialGraphQLContext | GraphQLContext> {}

export const build__UseScopedContainer = ({
  openAuthenticatedReadGraphQlContextScope,
  openAuthenticatedWriteGraphQlContextScope,
  openPublicRequestContextScope,
}: UseScopedContainerDeps): UseScopedContainer => ({
  async onExecute({ args, extendContext }) {
    const ctx = args.contextValue;

    // stage-2 kinds = context already extended (the union admits them; runtime never delivers them here)
    if (ctx.kind !== 'authenticated' && ctx.kind !== 'public') {
      return;
    }
    const op = getOperationType(args.document, args.operationName);

    const logContext: LogContext = {
      requestId: ctx.requestId,
      operationName: args.operationName as string,
      operationType: op,
      service: 'api',
    };
    if (ctx.kind === 'authenticated') {
      logContext.viewerId = ctx.viewer.id;
      if (op === 'mutation') {
        logContext.accessMode = 'authWrite';
        const { authenticatedWriteGraphQlContext, dispose } =
          openAuthenticatedWriteGraphQlContextScope({
            logContext,
            viewerId: ctx.viewer.id,
          });
        await authenticatedWriteGraphQlContext.start();
        extendContext({
          ...ctx,
          ...authenticatedWriteGraphQlContext,
          kind: 'authenticatedWrite',
        } satisfies AuthenticatedWriteGraphQLContext);

        return {
          async onExecuteDone({ result }) {
            if (isAsyncIterable(result)) {
              await authenticatedWriteGraphQlContext.finalize(false);
              await dispose();
              return;
            }
            await authenticatedWriteGraphQlContext.finalize(!result.errors?.length);
            await dispose();
          },
        };
      }
      logContext.accessMode = 'authRead';
      const { authenticatedReadGraphQlContext, dispose } = openAuthenticatedReadGraphQlContextScope(
        { logContext, viewerId: ctx.viewer.id },
      );
      await authenticatedReadGraphQlContext.start();

      extendContext({
        ...ctx,
        ...authenticatedReadGraphQlContext,
        kind: 'authenticatedRead',
      } satisfies AuthenticatedReadGraphQLContext);

      return {
        async onExecuteDone({ result }) {
          if (isAsyncIterable(result)) {
            await authenticatedReadGraphQlContext.finalize(false);
            await dispose();
            return;
          } // TODO streaming
          await authenticatedReadGraphQlContext.finalize(false);
          await dispose();
        },
      };
    }
    logContext.accessMode = 'public';
    logContext.publicLinkId = ctx.publicLinkId;
    const { publicRequestContext, dispose } = openPublicRequestContextScope({
      logContext,
      publicLinkId: ctx.publicLinkId,
    });
    await publicRequestContext.start();

    extendContext({
      ...ctx,
      ...publicRequestContext,
      kind: 'publicRead',
    } satisfies PublicReadGraphQLContext);

    return {
      async onExecuteDone({ result }) {
        if (isAsyncIterable(result)) {
          await publicRequestContext.finalize(false);
          await dispose();
          return;
        }
        await publicRequestContext.finalize(false);
        await dispose();
      },
    };
  },
});

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
