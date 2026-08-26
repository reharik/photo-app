// container.ts
import { AwilixContainer, createContainer } from 'awilix';
import { registerIocFromManifest } from 'ioc-manifest';
import {
  composedManifests,
  composedRegistrationOverrides,
  type AppCradle,
} from './generated/ioc-composed.js';

export const createWorkerContainer = (): AwilixContainer<AppCradle> => {
  const container = createContainer<AppCradle>();
  registerIocFromManifest(container, composedManifests, composedRegistrationOverrides);
  return container;
};
