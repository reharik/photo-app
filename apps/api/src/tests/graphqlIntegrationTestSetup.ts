import type { AwilixContainer } from 'awilix';
import { asValue, createContainer } from 'awilix';
import { ok } from '@packages/contracts';
import type { NotificationService } from '@packages/notifications';
import { registerIocFromManifest } from 'ioc-manifest';
import type { Knex } from 'knex';

import type { Config } from '../config.js';
import type { Cradle } from '../container.js';
import { build__CreateGraphQLContext } from '../graphql/context/createGraphQLContext.js';
import type { GraphQLInitialContext } from '../graphql/context/types.js';

import {
  composedManifests,
  composedRegistrationOverrides,
} from '../di/generated/ioc-composed.js';
import { ensureTestViewerUsers } from './ensureTestViewerUsers';
import { createExecuteGraphQL } from './executeGQL';
import { createIntegrationTestMediaStorage } from './integrationTestMediaStorage';

const registerTestKnexForGlobalTeardown = (container: AwilixContainer<Cradle>): void => {
  if (process.env.NODE_ENV !== 'test') {
    return;
  }
  const g = globalThis as typeof globalThis & { __photoappTestKnex?: Knex };
  g.__photoappTestKnex = container.resolve('database');
};

const noopNotificationService: NotificationService = {
  notify: async () => ok('integration-test-notification'),
};

/**
 * Shared bootstrap for GraphQL integration tests that hit the real DB (FKs on user ids).
 * Uses in-memory MediaStorage so tests do not require S3 or a local media directory.
 */
export const setupGraphqlIntegrationTests = async (): Promise<{
  container: AwilixContainer<Cradle>;
  executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  integrationTestMediaStorage: ReturnType<typeof createIntegrationTestMediaStorage>;
}> => {
  const integrationTestMediaStorage = createIntegrationTestMediaStorage();
  const container = createContainer<Cradle>({
    injectionMode: 'PROXY',
  });
  registerIocFromManifest(container, composedManifests, composedRegistrationOverrides);

  const config = container.resolve('config') as Config;
  const baseGraphQLContextFactory = build__CreateGraphQLContext({
    container,
    notificationService: noopNotificationService,
    config,
  });

  container.register({
    container: asValue(container),
    mediaStorage: asValue(integrationTestMediaStorage),
    notificationService: asValue(noopNotificationService),
    createGraphQLContext: asValue((initialContext: GraphQLInitialContext) => {
      try {
        return baseGraphQLContextFactory(initialContext);
      } catch {
        // Logged-out requests: viewer returns null; authenticated mutations fail auth checks.
        const scope = container.createScope();
        scope.register({ publicLinkId: asValue('anonymous-integration-test') });
        return {
          kind: 'public' as const,
          publicLinkId: 'anonymous-integration-test',
          publicReadServices: scope.resolve('publicReadServices'),
          agnosticReadServices: scope.resolve('agnosticReadServices'),
          config,
        };
      }
    }),
  });
  registerTestKnexForGlobalTeardown(container);
  await ensureTestViewerUsers(container.resolve('database'));
  const yogaApp = container.resolve('yogaApp');
  return {
    container,
    executeGraphQL: createExecuteGraphQL({ yogaApp, config }),
    integrationTestMediaStorage,
  };
};
