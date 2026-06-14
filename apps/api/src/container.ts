import { User } from '@packages/contracts';
import { EntityId } from '@packages/media-core';
import { asValue, AwilixContainer, createContainer } from 'awilix';
import { registerIocFromManifest } from 'ioc-manifest';
import {
  composedManifests,
  composedRegistrationOverrides,
  type AppCradle,
} from './di/generated/ioc-composed.js';

export type Cradle = AppCradle & {
  container: AwilixContainer<AppCradle>;
  viewerId: EntityId;
  viewer: User;
  publicLinkId: EntityId;
};

export const createAppContainer = (): AwilixContainer<Cradle> => {
  const container = createContainer<Cradle>({ injectionMode: 'PROXY' });
  registerIocFromManifest(container, composedManifests, composedRegistrationOverrides);
  container.register({ container: asValue(container) });
  return container;
};
