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
import type { IntervalGate } from '../intervalGate.js';
import type { KnexConfig } from '../knexfile.js';
import type { RunMediaWorkerLoop } from '../runMediaWorkerLoop.js';
import type {
  ProcessNextMediaDeletionJob,
  RunNextMediaDeletionJob,
} from '../tasks/queue/mediaWorkers/processNextMediaDeletionJob.js';
import type {
  ProcessNextMediaImageJob,
  RunNextMediaImageJob,
} from '../tasks/queue/mediaWorkers/processNextMediaImageJob.js';
import type { NotificationBatcher } from '../tasks/schedule/batchNotification/notificationBatcher.js';
import type { FastSweepNotification } from '../tasks/schedule/individualNotification/fastSweepNotification.js';
import type { FastSweepNotificationStrategy } from '../tasks/schedule/individualNotification/fastSweepNotificationStrategies/types.js';
import type { WorkerTask } from '../types.js';

export interface IocGeneratedCradle {
  albumSharedStrategy: FastSweepNotificationStrategy<'albumShareInvite'>;
  albumSharedWithNonUserStrategy: FastSweepNotificationStrategy<'albumGuestInvite'>;
  config: Config;
  database: Knex<any, any[]>;
  fastSweepNotification: FastSweepNotification;
  fastSweepNotificationStrategies: ReadonlyArray<
    FastSweepNotificationStrategy<
      | 'albumShareInvite'
      | 'albumGuestInvite'
      | 'itemShareInvite'
      | 'welcome'
      | 'albumActivity'
      | 'passwordReset'
      | 'forgotPassword'
    >
  >;
  fastSweepNotificationTask: WorkerTask;
  intervalGate: IntervalGate;
  knexConfig: KnexConfig;
  mediaDeletionTask: WorkerTask;
  mediaImageTask: WorkerTask;
  mediaItemsSharedStrategy: FastSweepNotificationStrategy<'itemShareInvite'>;
  notificationBatcher: NotificationBatcher;
  notificationBatchTask: WorkerTask;
  processNextMediaDeletionJob: ProcessNextMediaDeletionJob;
  processNextMediaImageJob: ProcessNextMediaImageJob;
  runMediaWorkerLoop: RunMediaWorkerLoop;
  runNextMediaDeletionJob: RunNextMediaDeletionJob;
  runNextMediaImageJob: RunNextMediaImageJob;
  workerTasks: ReadonlyArray<WorkerTask>;
}

export type FastSweepNotificationStrategies = ReadonlyArray<
  FastSweepNotificationStrategy<
    | 'albumShareInvite'
    | 'albumGuestInvite'
    | 'itemShareInvite'
    | 'welcome'
    | 'albumActivity'
    | 'passwordReset'
    | 'forgotPassword'
  >
>;

export type WorkerTasks = ReadonlyArray<WorkerTask>;

export interface IocExternals {
  container: AwilixContainer<IocGeneratedCradle>;
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
