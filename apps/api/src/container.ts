import { AwilixContainer, createContainer } from 'awilix';
import { registerIocFromManifest } from 'ioc-manifest';
import {
  composedManifests,
  composedRegistrationOverrides,
  type AppCradle,
} from './di/generated/ioc-composed.js';

let container: AwilixContainer<AppCradle> | undefined;

const initializeContainer = (): AwilixContainer<AppCradle> => {
  if (container) {
    return container;
  }

  const _container = createContainer<AppCradle>({
    injectionMode: 'PROXY',
  });

  registerIocFromManifest(_container, composedManifests, composedRegistrationOverrides);

  container = _container;
  return container;
};

const getContainer = (): AwilixContainer<AppCradle> => {
  if (!container) {
    throw new Error(
      '[ioc] container has not been initialized yet. Call initializeContainer() first.',
    );
  }

  return container;
};

export { getContainer, initializeContainer };
