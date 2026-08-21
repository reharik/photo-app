import { DocumentNode, Kind, OperationDefinitionNode } from 'graphql';
import { isAsyncIterable, type Plugin } from 'graphql-yoga';
import {
  OpenAuthenticatedReadGraphQlContextScope,
  OpenAuthenticatedWriteGraphQlContextScope,
  OpenPublicRequestContextScope,
} from '../../di/generated/ioc-registry.types';
import {
  AuthenticatedReadGraphQLContext,
  AuthenticatedWriteGraphQLContext,
  GraphQLContext,
  InitialGraphQLContext,
  PublicReadGraphQLContext,
} from '../context/types';

type ScopedContainerPluginDeps = {
  openAuthenticatedReadGraphQlContextScope: OpenAuthenticatedReadGraphQlContextScope;
  openAuthenticatedWriteGraphQlContextScope: OpenAuthenticatedWriteGraphQlContextScope;
  openPublicRequestContextScope: OpenPublicRequestContextScope;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ScopedContainerPlugin extends Plugin<InitialGraphQLContext | GraphQLContext> {}

export const build__UseScopedContainer = ({
  openAuthenticatedReadGraphQlContextScope,
  openAuthenticatedWriteGraphQlContextScope,
  openPublicRequestContextScope,
}: ScopedContainerPluginDeps): ScopedContainerPlugin => ({
  async onExecute({ args, extendContext }) {
    const ctx = args.contextValue;

    // stage-2 kinds = context already extended (the union admits them; runtime never delivers them here)
    if (ctx.kind !== 'authenticated' && ctx.kind !== 'public') {
      return;
    }

    if (ctx.kind === 'authenticated') {
      const op = getOperationType(args.document, args.operationName);

      if (op === 'mutation') {
        const { authenticatedWriteGraphQlContext, dispose } =
          openAuthenticatedWriteGraphQlContextScope({
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
      const { authenticatedReadGraphQlContext, dispose } = openAuthenticatedReadGraphQlContextScope(
        {
          viewerId: ctx.viewer.id,
        },
      );

      extendContext({
        ...ctx,
        ...authenticatedReadGraphQlContext,
        kind: 'authenticatedRead',
      } satisfies AuthenticatedReadGraphQLContext);

      return {
        async onExecuteDone({ result }) {
          if (isAsyncIterable(result)) {
            await dispose();
            return;
          } // TODO streaming
          await dispose();
        },
      };
    }

    const { publicRequestContext, dispose } = openPublicRequestContextScope({
      publicLinkId: ctx.publicLinkId,
    });

    extendContext({
      ...ctx,
      ...publicRequestContext,
      kind: 'publicRead',
    } satisfies PublicReadGraphQLContext);

    return {
      async onExecuteDone({ result }) {
        if (isAsyncIterable(result)) {
          await dispose();
          return;
        }
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
