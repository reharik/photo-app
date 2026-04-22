import type { AwilixContainer } from 'awilix';

import { buildProcessNextMediaImageJob } from '../../../media-worker/src/application/processNextMediaImageJob.js';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types.js';

/**
 * Runs one media-worker image-derivation job using the same DI deps as the API test container.
 * Call after finalizing a photo upload so the item reaches READY and derived URLs are available.
 */
export const runOnePhotoDerivativesJob = async (
  container: AwilixContainer<IocGeneratedCradle>,
): Promise<'processed' | 'idle'> => {
  const run = buildProcessNextMediaImageJob({
    config: container.resolve('config'),
    mediaItemRepository: container.resolve('mediaItemRepository'),
    mediaProcessingJobRepository: container.resolve('mediaProcessingJobRepository'),
    mediaStorage: container.resolve('mediaStorage'),
    logger: container.resolve('logger'),
  } as never);
  return run();
};
