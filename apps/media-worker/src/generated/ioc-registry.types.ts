/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { Knex } from 'knex';
import type { MediaStorage } from '../../../../packages/context/media-core/dist/src/application/media/MediaStorage';
import type { MediaItemRepository } from '../../../../packages/context/media-core/dist/src/repositories/domainRepositories/mediaItemRepository';
import type { Logger } from '../../../../packages/foundation/infrastructure/dist/src/logger/coreLogger';
import type { ProcessNextMediaDeletionJob } from '../application/processNextMediaDeletionJob.js';
import type { ProcessNextMediaImageJob } from '../application/processNextMediaImageJob.js';
import type { Config } from '../config.js';
import type { KnexConfig } from '../knexfile.js';
import type { MediaDeletionJobRepository } from '../repositories/domainRepositories/mediaDeletionJobRepository.js';
import type { MediaProcessingJobRepository } from '../repositories/domainRepositories/mediaProcessingJobRepository.js';
import type { RunMediaWorkerLoop } from '../runMediaWorkerLoop.js';

export interface IocGeneratedCradle {
  config: Config;
  database: Knex;
  knexConfig: KnexConfig;
  mediaDeletionJobRepository: MediaDeletionJobRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  processNextMediaDeletionJob: ProcessNextMediaDeletionJob;
  processNextMediaImageJob: ProcessNextMediaImageJob;
  runMediaWorkerLoop: RunMediaWorkerLoop;
}

export interface IocExternals {
  logger: Logger;
  mediaItemRepository: MediaItemRepository;
  mediaStorage: MediaStorage;
}
