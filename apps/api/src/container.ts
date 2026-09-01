import { AwilixContainer, createContainer } from 'awilix';
import { registerIocFromManifest } from 'ioc-manifest';
import {
  composedManifests,
  composedRegistrationOverrides,
  type AppCradle,
} from './di/generated/ioc-composed.js';

export const createAppContainer = (): AwilixContainer<AppCradle> => {
  const container = createContainer<AppCradle>();
  registerIocFromManifest(container, composedManifests, composedRegistrationOverrides);
  return container;
};
