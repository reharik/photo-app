/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { Logger } from '@packages/infrastructure';
import type {
  MediaDeletionJobRepository,
  MediaItemRepository,
  MediaProcessingJobRepository,
  MediaStorage,
  SystemAlbumRepository,
  SystemAuthorizationRepository,
  SystemPendingNotificationRepository,
  SystemUserRepository,
} from '@packages/media-core';
import type { NotificationService } from '@packages/notifications';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';
import type { Config } from '../config.js';
import type { KnexConfig } from '../knexfile.js';
import type { RunMediaWorkerLoop } from '../runMediaWorkerLoop.js';
import type {
  ProcessNextMediaDeletionJob,
  RunNextMediaDeletionJob,
} from '../tasks/mediaWorkers/processNextMediaDeletionJob.js';
import type {
  ProcessNextMediaImageJob,
  RunNextMediaImageJob,
} from '../tasks/mediaWorkers/processNextMediaImageJob.js';
import type { NotificationBatcher } from '../tasks/notificationWorkers/notificationBatcher.js';
import type { WorkerTask } from '../types.js';

export interface IocGeneratedCradle {
  config: Config;
  database: Knex;
  knexConfig: KnexConfig;
  mediaDeletionTask: WorkerTask;
  mediaImageTask: WorkerTask;
  notificationBatcher: NotificationBatcher;
  notificationSweepTask: WorkerTask;
  processNextMediaDeletionJob: ProcessNextMediaDeletionJob;
  processNextMediaImageJob: ProcessNextMediaImageJob;
  runMediaWorkerLoop: RunMediaWorkerLoop;
  runNextMediaDeletionJob: RunNextMediaDeletionJob;
  runNextMediaImageJob: RunNextMediaImageJob;
  workerTask: WorkerTask;
  workerTasks: ReadonlyArray<WorkerTask>;
}

export interface IocExternals {
  container: AwilixContainer;
  logger: Logger;
  mediaDeletionJobRepository: MediaDeletionJobRepository;
  mediaItemRepository: MediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  mediaStorage: MediaStorage;
  notificationService: NotificationService;
  systemAlbumRepository: SystemAlbumRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
  systemUserRepository: SystemUserRepository;
}

export interface IocScopeProvided {}
