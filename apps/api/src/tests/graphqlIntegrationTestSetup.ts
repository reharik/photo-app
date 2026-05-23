import type { AwilixContainer } from 'awilix';
import { asValue, createContainer } from 'awilix';
import { registerIocFromManifest } from 'ioc-manifest';
import type { Knex } from 'knex';

import {
  composedManifests,
  composedRegistrationOverrides,
  type AppCradle,
} from '../di/generated/ioc-composed.js';
import { ensureTestViewerUsers } from './ensureTestViewerUsers';
import { createExecuteGraphQL } from './executeGQL';
import { createIntegrationTestMediaStorage } from './integrationTestMediaStorage';

const registerTestKnexForGlobalTeardown = (
  container: AwilixContainer<AppCradle>,
): void => {
  if (process.env.NODE_ENV !== 'test') {
    return;
  }
  const g = globalThis as typeof globalThis & { __photoappTestKnex?: Knex };
  g.__photoappTestKnex = container.resolve('database');
};

/**
 * Shared bootstrap for GraphQL integration tests that hit the real DB (FKs on user ids).
 * Uses in-memory MediaStorage so tests do not require S3 or a local media directory.
 */
export const setupGraphqlIntegrationTests = async (): Promise<{
  container: AwilixContainer<AppCradle>;
  executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  integrationTestMediaStorage: ReturnType<typeof createIntegrationTestMediaStorage>;
}> => {
  const integrationTestMediaStorage = createIntegrationTestMediaStorage();
  const container = createContainer<AppCradle>({
    injectionMode: 'PROXY',
  });
  registerIocFromManifest(
    container,
    composedManifests,
    composedRegistrationOverrides,
  );
  container.register({
    mediaStorage: asValue(integrationTestMediaStorage),
  });
  registerTestKnexForGlobalTeardown(container);
  await ensureTestViewerUsers(container.resolve('database'));
  const yogaApp = container.resolve('yogaApp');
  const config = container.resolve('config');
  return {
    container,
    executeGraphQL: createExecuteGraphQL({ yogaApp, config }),
    integrationTestMediaStorage,
  };
};
