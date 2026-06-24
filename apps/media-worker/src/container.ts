import { asValue, AwilixContainer, createContainer, type NameAndRegistrationPair } from 'awilix';
import { registerIocFromManifest } from 'ioc-manifest';
import type { Knex } from 'knex';
import {
  composedManifests,
  composedRegistrationOverrides,
  type AppCradle,
} from './generated/ioc-composed.js';

let container: AwilixContainer<AppCradle> | undefined;

const initializeWorkerContainer = (): AwilixContainer<AppCradle> => {
  if (container) {
    return container;
  }

  const _container = createContainer<AppCradle>({
    injectionMode: 'PROXY',
  });

  registerIocFromManifest(_container, composedManifests, composedRegistrationOverrides);
  _container.register({
    container: asValue(_container),
  } as NameAndRegistrationPair<AppCradle>);

  container = _container;
  return container;
};

const getWorkerContainer = (): AwilixContainer<AppCradle> => {
  if (!container) {
    throw new Error(
      '[ioc] container has not been initialized yet. Call initializeWorkerContainer() first.',
    );
  }

  return container;
};

const destroyWorkerContainer = async (): Promise<void> => {
  if (!container) {
    return;
  }
  const db = container.resolve<Knex>('database');
  await db.destroy();
  container = undefined;
};

export { destroyWorkerContainer, getWorkerContainer, initializeWorkerContainer };
