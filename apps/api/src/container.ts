import { EntityId } from '@packages/media-core';
import { asValue, AwilixContainer, createContainer } from 'awilix';
import { registerIocFromManifest } from 'ioc-manifest';
import {
  composedManifests,
  composedRegistrationOverrides,
  type AppCradle,
} from './di/generated/ioc-composed.js';
import { GraphQLContextViewer } from './graphql/context/types';

export type Cradle = AppCradle & {
  container: AwilixContainer<AppCradle>;
  viewerId: EntityId;
  viewer: GraphQLContextViewer;
  publicLinkId: EntityId;
};

export const createAppContainer = (): AwilixContainer<Cradle> => {
  const container = createContainer<Cradle>({ injectionMode: 'PROXY' });
  registerIocFromManifest(container, composedManifests, composedRegistrationOverrides);
  container.register({ container: asValue(container) });
  return container;
};
