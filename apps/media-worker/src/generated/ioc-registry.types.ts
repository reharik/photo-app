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
  SystemAsyncNotificationRepository,
  SystemAuthorizationRepository,
  SystemCommentRepository,
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
  MediaDeletionTask,
  MediaImageTask,
} from '../tasks/queue/mediaWorkers/mediaWorkerTasks.js';
import type {
  ProcessNextMediaDeletionJob,
  RunNextMediaDeletionJob,
} from '../tasks/queue/mediaWorkers/processNextMediaDeletionJob.js';
import type {
  ProcessNextMediaImageJob,
  RunNextMediaImageJob,
} from '../tasks/queue/mediaWorkers/processNextMediaImageJob.js';
import type { AlbumActivity } from '../tasks/schedule/batchNotification/batchedPayloads/albumActivity.js';
import type { CommentActivity } from '../tasks/schedule/batchNotification/batchedPayloads/commentActivity.js';
import type { ReactionActivity } from '../tasks/schedule/batchNotification/batchedPayloads/reactionActivity.js';
import type { NotificationBatcher } from '../tasks/schedule/batchNotification/notificationBatcher.js';
import type { NotificationBatchTask } from '../tasks/schedule/batchNotification/notificationBatchTask.js';
import type { FastSweepNotification } from '../tasks/schedule/individualNotification/fastSweepNotification.js';
import type { FastSweepNotificationStrategy } from '../tasks/schedule/individualNotification/fastSweepNotificationStrategies/types.js';
import type { FastSweepNotificationTask } from '../tasks/schedule/individualNotification/fastSweepNotificationTask.js';
import type { StalledMediaJobSweep } from '../tasks/schedule/stalledMediaJobSweep/stalledMediaJobSweep.js';
import type { StalledMediaJobSweepTask } from '../tasks/schedule/stalledMediaJobSweep/stalledMediaJobSweepTask.js';

export interface IocGeneratedCradle {
  albumActivity: AlbumActivity;
  albumSharedStrategy: FastSweepNotificationStrategy<'memberAlbumShared'>;
  albumSharedWithNonUserStrategy: FastSweepNotificationStrategy<'guestAlbumShared'>;
  batchedEmailActivity: ReadonlyArray<AlbumActivity | CommentActivity | ReactionActivity>;
  commentActivity: CommentActivity;
  config: Config;
  database: Knex<any, any[]>;
  fastSweepNotification: FastSweepNotification;
  fastSweepNotificationStrategies: ReadonlyArray<
    FastSweepNotificationStrategy<
      | 'memberAlbumShared'
      | 'guestAlbumShared'
      | 'welcome'
      | 'memberItemsShared'
      | 'activityDigest'
      | 'passwordChanged'
      | 'verificationCode'
    >
  >;
  fastSweepNotificationTask: FastSweepNotificationTask;
  intervalGate: IntervalGate;
  knexConfig: KnexConfig;
  mediaDeletionTask: MediaDeletionTask;
  mediaImageTask: MediaImageTask;
  notificationBatcher: NotificationBatcher;
  notificationBatchTask: NotificationBatchTask;
  processNextMediaDeletionJob: ProcessNextMediaDeletionJob;
  processNextMediaImageJob: ProcessNextMediaImageJob;
  reactionActivity: ReactionActivity;
  runMediaWorkerLoop: RunMediaWorkerLoop;
  runNextMediaDeletionJob: RunNextMediaDeletionJob;
  runNextMediaImageJob: RunNextMediaImageJob;
  stalledMediaJobSweep: StalledMediaJobSweep;
  stalledMediaJobSweepTask: StalledMediaJobSweepTask;
  workerTasks: ReadonlyArray<
    | FastSweepNotificationTask
    | MediaDeletionTask
    | MediaImageTask
    | NotificationBatchTask
    | StalledMediaJobSweepTask
  >;
}

export type BatchedEmailActivity = ReadonlyArray<
  AlbumActivity | CommentActivity | ReactionActivity
>;

export type FastSweepNotificationStrategies = ReadonlyArray<
  FastSweepNotificationStrategy<
    | 'memberAlbumShared'
    | 'guestAlbumShared'
    | 'welcome'
    | 'memberItemsShared'
    | 'activityDigest'
    | 'passwordChanged'
    | 'verificationCode'
  >
>;

export type WorkerTasks = ReadonlyArray<
  | FastSweepNotificationTask
  | MediaDeletionTask
  | MediaImageTask
  | NotificationBatchTask
  | StalledMediaJobSweepTask
>;

export interface IocExternals {
  container: AwilixContainer<IocGeneratedCradle>;
  logger: Logger;
  mediaDeletionJobRepository: MediaDeletionJobRepository;
  mediaItemRepository: MediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  mediaStorage: MediaStorage;
  notificationService: NotificationService;
  systemAlbumRepository: SystemAlbumRepository;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
  systemCommentRepository: SystemCommentRepository;
  systemUserRepository: SystemUserRepository;
}

export interface IocScopeProvided {}
