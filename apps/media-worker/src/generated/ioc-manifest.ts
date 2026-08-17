/* AUTO-GENERATED. DO NOT EDIT.
Primary container manifest.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { IocGeneratedContainerManifest, IocModuleNamespace } from 'ioc-manifest';

import * as ioc_config from '../config.js';
import * as ioc_intervalGate from '../intervalGate.js';
import * as ioc_knex from '../knex.js';
import * as ioc_knexfile from '../knexfile.js';
import * as ioc_runMediaWorkerLoop from '../runMediaWorkerLoop.js';
import * as ioc_tasks_queue_mediaWorkers_mediaWorkerTasks from '../tasks/queue/mediaWorkers/mediaWorkerTasks.js';
import * as ioc_tasks_queue_mediaWorkers_processNextMediaDeletionJob from '../tasks/queue/mediaWorkers/processNextMediaDeletionJob.js';
import * as ioc_tasks_queue_mediaWorkers_processNextMediaImageJob from '../tasks/queue/mediaWorkers/processNextMediaImageJob.js';
import * as ioc_tasks_schedule_batchNotification_batchedPayloads_albumActivity from '../tasks/schedule/batchNotification/batchedPayloads/albumActivity.js';
import * as ioc_tasks_schedule_batchNotification_batchedPayloads_commentActivity from '../tasks/schedule/batchNotification/batchedPayloads/commentActivity.js';
import * as ioc_tasks_schedule_batchNotification_batchedPayloads_reactionActivity from '../tasks/schedule/batchNotification/batchedPayloads/reactionActivity.js';
import * as ioc_tasks_schedule_batchNotification_notificationBatcher from '../tasks/schedule/batchNotification/notificationBatcher.js';
import * as ioc_tasks_schedule_batchNotification_notificationBatchTask from '../tasks/schedule/batchNotification/notificationBatchTask.js';
import * as ioc_tasks_schedule_individualNotification_fastSweepNotification from '../tasks/schedule/individualNotification/fastSweepNotification.js';
import * as ioc_tasks_schedule_individualNotification_fastSweepNotificationStrategies_albumSharedStrategy from '../tasks/schedule/individualNotification/fastSweepNotificationStrategies/albumSharedStrategy.js';
import * as ioc_tasks_schedule_individualNotification_fastSweepNotificationStrategies_albumSharedWithNonUserStrategy from '../tasks/schedule/individualNotification/fastSweepNotificationStrategies/albumSharedWithNonUserStrategy.js';
import * as ioc_tasks_schedule_individualNotification_fastSweepNotificationTask from '../tasks/schedule/individualNotification/fastSweepNotificationTask.js';
import * as ioc_tasks_schedule_stalledMediaJobSweep_stalledMediaJobSweep from '../tasks/schedule/stalledMediaJobSweep/stalledMediaJobSweep.js';
import * as ioc_tasks_schedule_stalledMediaJobSweep_stalledMediaJobSweepTask from '../tasks/schedule/stalledMediaJobSweep/stalledMediaJobSweepTask.js';

type IocManifestGroupRoots = {
  readonly batchedEmailActivity: {
    readonly kind: 'collection';
    readonly baseType: 'BatchedEmailPayload';
    readonly baseTypeId: '/home/reharik/Development/photoapp-cc/apps/media-worker/src/tasks/schedule/batchNotification/batchedPayloads/types.ts:BatchedEmailPayload';
    readonly members: readonly [
      { readonly contractName: 'AlbumActivity'; readonly registrationKey: 'albumActivity' },
      { readonly contractName: 'CommentActivity'; readonly registrationKey: 'commentActivity' },
      { readonly contractName: 'ReactionActivity'; readonly registrationKey: 'reactionActivity' },
    ];
  };
  readonly fastSweepNotificationStrategies: {
    readonly kind: 'collection';
    readonly baseType: 'FastSweepNotificationStrategy';
    readonly baseTypeId: '/home/reharik/Development/photoapp-cc/apps/media-worker/src/tasks/schedule/individualNotification/fastSweepNotificationStrategies/types.ts:FastSweepNotificationStrategy';
    readonly members: readonly [
      {
        readonly contractName: 'FastSweepNotificationStrategy';
        readonly registrationKey: 'albumSharedStrategy';
      },
      {
        readonly contractName: 'FastSweepNotificationStrategy';
        readonly registrationKey: 'albumSharedWithNonUserStrategy';
      },
    ];
  };
  readonly workerTasks: {
    readonly kind: 'collection';
    readonly baseType: 'WorkerTaskBase';
    readonly baseTypeId: '/home/reharik/Development/photoapp-cc/apps/media-worker/src/types.ts:WorkerTaskBase';
    readonly members: readonly [
      {
        readonly contractName: 'FastSweepNotificationTask';
        readonly registrationKey: 'fastSweepNotificationTask';
      },
      { readonly contractName: 'MediaDeletionTask'; readonly registrationKey: 'mediaDeletionTask' },
      { readonly contractName: 'MediaImageTask'; readonly registrationKey: 'mediaImageTask' },
      {
        readonly contractName: 'NotificationBatchTask';
        readonly registrationKey: 'notificationBatchTask';
      },
      {
        readonly contractName: 'StalledMediaJobSweepTask';
        readonly registrationKey: 'stalledMediaJobSweepTask';
      },
    ];
  };
};

export const iocManifest = {
  manifestSchemaVersion: 2,

  moduleImports: [
    ioc_config,
    ioc_intervalGate,
    ioc_knex,
    ioc_knexfile,
    ioc_runMediaWorkerLoop,
    ioc_tasks_queue_mediaWorkers_mediaWorkerTasks,
    ioc_tasks_queue_mediaWorkers_processNextMediaDeletionJob,
    ioc_tasks_queue_mediaWorkers_processNextMediaImageJob,
    ioc_tasks_schedule_batchNotification_batchedPayloads_albumActivity,
    ioc_tasks_schedule_batchNotification_batchedPayloads_commentActivity,
    ioc_tasks_schedule_batchNotification_batchedPayloads_reactionActivity,
    ioc_tasks_schedule_batchNotification_notificationBatcher,
    ioc_tasks_schedule_batchNotification_notificationBatchTask,
    ioc_tasks_schedule_individualNotification_fastSweepNotification,
    ioc_tasks_schedule_individualNotification_fastSweepNotificationStrategies_albumSharedStrategy,
    ioc_tasks_schedule_individualNotification_fastSweepNotificationStrategies_albumSharedWithNonUserStrategy,
    ioc_tasks_schedule_individualNotification_fastSweepNotificationTask,
    ioc_tasks_schedule_stalledMediaJobSweep_stalledMediaJobSweep,
    ioc_tasks_schedule_stalledMediaJobSweep_stalledMediaJobSweepTask,
  ] as const satisfies readonly IocModuleNamespace[],

  contracts: {
    AlbumActivity: {
      albumActivity: {
        exportName: 'build__AlbumActivity',
        registrationKey: 'albumActivity',
        modulePath: 'tasks/schedule/batchNotification/batchedPayloads/albumActivity.ts',
        relImport: '../tasks/schedule/batchNotification/batchedPayloads/albumActivity.js',
        contractName: 'AlbumActivity',
        implementationName: 'albumActivity',
        lifetime: 'singleton',
        moduleIndex: 8,
        default: true,
        discoveredBy: 'naming',
      },
    },
    CommentActivity: {
      commentActivity: {
        exportName: 'build__CommentActivity',
        registrationKey: 'commentActivity',
        modulePath: 'tasks/schedule/batchNotification/batchedPayloads/commentActivity.ts',
        relImport: '../tasks/schedule/batchNotification/batchedPayloads/commentActivity.js',
        contractName: 'CommentActivity',
        implementationName: 'commentActivity',
        lifetime: 'singleton',
        moduleIndex: 9,
        default: true,
        discoveredBy: 'naming',
      },
    },
    Config: {
      config: {
        exportName: 'build__Config',
        registrationKey: 'config',
        modulePath: 'config.ts',
        relImport: '../config.js',
        contractName: 'Config',
        implementationName: 'config',
        lifetime: 'singleton',
        moduleIndex: 0,
        default: true,
        discoveredBy: 'naming',
      },
    },
    FastSweepNotification: {
      fastSweepNotification: {
        exportName: 'build__FastSweepNotification',
        registrationKey: 'fastSweepNotification',
        modulePath: 'tasks/schedule/individualNotification/fastSweepNotification.ts',
        relImport: '../tasks/schedule/individualNotification/fastSweepNotification.js',
        contractName: 'FastSweepNotification',
        implementationName: 'fastSweepNotification',
        lifetime: 'singleton',
        moduleIndex: 13,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    FastSweepNotificationStrategy: {
      albumSharedStrategy: {
        exportName: 'build__AlbumSharedStrategy',
        registrationKey: 'albumSharedStrategy',
        modulePath:
          'tasks/schedule/individualNotification/fastSweepNotificationStrategies/albumSharedStrategy.ts',
        relImport:
          '../tasks/schedule/individualNotification/fastSweepNotificationStrategies/albumSharedStrategy.js',
        contractName: 'FastSweepNotificationStrategy',
        implementationName: 'albumSharedStrategy',
        lifetime: 'singleton',
        moduleIndex: 14,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
      albumSharedWithNonUserStrategy: {
        exportName: 'build__AlbumSharedWithNonUserStrategy',
        registrationKey: 'albumSharedWithNonUserStrategy',
        modulePath:
          'tasks/schedule/individualNotification/fastSweepNotificationStrategies/albumSharedWithNonUserStrategy.ts',
        relImport:
          '../tasks/schedule/individualNotification/fastSweepNotificationStrategies/albumSharedWithNonUserStrategy.js',
        contractName: 'FastSweepNotificationStrategy',
        implementationName: 'albumSharedWithNonUserStrategy',
        lifetime: 'singleton',
        moduleIndex: 15,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    FastSweepNotificationTask: {
      fastSweepNotificationTask: {
        exportName: 'build__FastSweepNotificationTask',
        registrationKey: 'fastSweepNotificationTask',
        modulePath: 'tasks/schedule/individualNotification/fastSweepNotificationTask.ts',
        relImport: '../tasks/schedule/individualNotification/fastSweepNotificationTask.js',
        contractName: 'FastSweepNotificationTask',
        implementationName: 'fastSweepNotificationTask',
        lifetime: 'singleton',
        moduleIndex: 16,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['FastSweepNotification'],
      },
    },
    IntervalGate: {
      intervalGate: {
        exportName: 'build__IntervalGate',
        registrationKey: 'intervalGate',
        modulePath: 'intervalGate.ts',
        relImport: '../intervalGate.js',
        contractName: 'IntervalGate',
        implementationName: 'intervalGate',
        lifetime: 'singleton',
        moduleIndex: 1,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    Knex: {
      database: {
        exportName: 'build__Database',
        registrationKey: 'database',
        modulePath: 'knex.ts',
        relImport: '../knex.js',
        contractName: 'Knex',
        implementationName: 'database',
        lifetime: 'singleton',
        moduleIndex: 2,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['accessKey'],
        dependencyContractNames: ['KnexConfig'],
        accessKey: 'database',
      },
    },
    KnexConfig: {
      knexConfig: {
        exportName: 'build__KnexConfig',
        registrationKey: 'knexConfig',
        modulePath: 'knexfile.ts',
        relImport: '../knexfile.js',
        contractName: 'KnexConfig',
        implementationName: 'knexConfig',
        lifetime: 'singleton',
        moduleIndex: 3,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    MediaDeletionTask: {
      mediaDeletionTask: {
        exportName: 'build__MediaDeletionTask',
        registrationKey: 'mediaDeletionTask',
        modulePath: 'tasks/queue/mediaWorkers/mediaWorkerTasks.ts',
        relImport: '../tasks/queue/mediaWorkers/mediaWorkerTasks.js',
        contractName: 'MediaDeletionTask',
        implementationName: 'mediaDeletionTask',
        lifetime: 'singleton',
        moduleIndex: 5,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['RunNextMediaDeletionJob'],
      },
    },
    MediaImageTask: {
      mediaImageTask: {
        exportName: 'build__MediaImageTask',
        registrationKey: 'mediaImageTask',
        modulePath: 'tasks/queue/mediaWorkers/mediaWorkerTasks.ts',
        relImport: '../tasks/queue/mediaWorkers/mediaWorkerTasks.js',
        contractName: 'MediaImageTask',
        implementationName: 'mediaImageTask',
        lifetime: 'singleton',
        moduleIndex: 5,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['RunNextMediaImageJob'],
      },
    },
    NotificationBatcher: {
      notificationBatcher: {
        exportName: 'build__NotificationBatcher',
        registrationKey: 'notificationBatcher',
        modulePath: 'tasks/schedule/batchNotification/notificationBatcher.ts',
        relImport: '../tasks/schedule/batchNotification/notificationBatcher.js',
        contractName: 'NotificationBatcher',
        implementationName: 'notificationBatcher',
        lifetime: 'singleton',
        moduleIndex: 11,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    NotificationBatchTask: {
      notificationBatchTask: {
        exportName: 'build__NotificationBatchTask',
        registrationKey: 'notificationBatchTask',
        modulePath: 'tasks/schedule/batchNotification/notificationBatchTask.ts',
        relImport: '../tasks/schedule/batchNotification/notificationBatchTask.js',
        contractName: 'NotificationBatchTask',
        implementationName: 'notificationBatchTask',
        lifetime: 'singleton',
        moduleIndex: 12,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['NotificationBatcher'],
      },
    },
    ProcessNextMediaDeletionJob: {
      processNextMediaDeletionJob: {
        exportName: 'build__ProcessNextMediaDeletionJob',
        registrationKey: 'processNextMediaDeletionJob',
        modulePath: 'tasks/queue/mediaWorkers/processNextMediaDeletionJob.ts',
        relImport: '../tasks/queue/mediaWorkers/processNextMediaDeletionJob.js',
        contractName: 'ProcessNextMediaDeletionJob',
        implementationName: 'processNextMediaDeletionJob',
        lifetime: 'scoped',
        moduleIndex: 6,
        default: true,
        discoveredBy: 'naming',
      },
    },
    ProcessNextMediaImageJob: {
      processNextMediaImageJob: {
        exportName: 'build__ProcessNextMediaImageJob',
        registrationKey: 'processNextMediaImageJob',
        modulePath: 'tasks/queue/mediaWorkers/processNextMediaImageJob.ts',
        relImport: '../tasks/queue/mediaWorkers/processNextMediaImageJob.js',
        contractName: 'ProcessNextMediaImageJob',
        implementationName: 'processNextMediaImageJob',
        lifetime: 'scoped',
        moduleIndex: 7,
        default: true,
        discoveredBy: 'naming',
      },
    },
    ReactionActivity: {
      reactionActivity: {
        exportName: 'build__ReactionActivity',
        registrationKey: 'reactionActivity',
        modulePath: 'tasks/schedule/batchNotification/batchedPayloads/reactionActivity.ts',
        relImport: '../tasks/schedule/batchNotification/batchedPayloads/reactionActivity.js',
        contractName: 'ReactionActivity',
        implementationName: 'reactionActivity',
        lifetime: 'singleton',
        moduleIndex: 10,
        default: true,
        discoveredBy: 'naming',
      },
    },
    RunMediaWorkerLoop: {
      runMediaWorkerLoop: {
        exportName: 'build__RunMediaWorkerLoop',
        registrationKey: 'runMediaWorkerLoop',
        modulePath: 'runMediaWorkerLoop.ts',
        relImport: '../runMediaWorkerLoop.js',
        contractName: 'RunMediaWorkerLoop',
        implementationName: 'runMediaWorkerLoop',
        lifetime: 'singleton',
        moduleIndex: 4,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config', 'IntervalGate'],
      },
    },
    RunNextMediaDeletionJob: {
      runNextMediaDeletionJob: {
        exportName: 'build__RunNextMediaDeletionJob',
        registrationKey: 'runNextMediaDeletionJob',
        modulePath: 'tasks/queue/mediaWorkers/processNextMediaDeletionJob.ts',
        relImport: '../tasks/queue/mediaWorkers/processNextMediaDeletionJob.js',
        contractName: 'RunNextMediaDeletionJob',
        implementationName: 'runNextMediaDeletionJob',
        lifetime: 'singleton',
        moduleIndex: 6,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    RunNextMediaImageJob: {
      runNextMediaImageJob: {
        exportName: 'build__RunNextMediaImageJob',
        registrationKey: 'runNextMediaImageJob',
        modulePath: 'tasks/queue/mediaWorkers/processNextMediaImageJob.ts',
        relImport: '../tasks/queue/mediaWorkers/processNextMediaImageJob.js',
        contractName: 'RunNextMediaImageJob',
        implementationName: 'runNextMediaImageJob',
        lifetime: 'singleton',
        moduleIndex: 7,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    StalledMediaJobSweep: {
      stalledMediaJobSweep: {
        exportName: 'build__StalledMediaJobSweep',
        registrationKey: 'stalledMediaJobSweep',
        modulePath: 'tasks/schedule/stalledMediaJobSweep/stalledMediaJobSweep.ts',
        relImport: '../tasks/schedule/stalledMediaJobSweep/stalledMediaJobSweep.js',
        contractName: 'StalledMediaJobSweep',
        implementationName: 'stalledMediaJobSweep',
        lifetime: 'singleton',
        moduleIndex: 17,
        default: true,
        discoveredBy: 'naming',
      },
    },
    StalledMediaJobSweepTask: {
      stalledMediaJobSweepTask: {
        exportName: 'build__StalledMediaJobSweepTask',
        registrationKey: 'stalledMediaJobSweepTask',
        modulePath: 'tasks/schedule/stalledMediaJobSweep/stalledMediaJobSweepTask.ts',
        relImport: '../tasks/schedule/stalledMediaJobSweep/stalledMediaJobSweepTask.js',
        contractName: 'StalledMediaJobSweepTask',
        implementationName: 'stalledMediaJobSweepTask',
        lifetime: 'singleton',
        moduleIndex: 18,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['StalledMediaJobSweep'],
      },
    },
  },
  // batchedEmailActivity
  batchedEmailActivity: {
    kind: 'collection',
    baseType: 'BatchedEmailPayload',
    baseTypeId:
      '/home/reharik/Development/photoapp-cc/apps/media-worker/src/tasks/schedule/batchNotification/batchedPayloads/types.ts:BatchedEmailPayload',
    members: [
      {
        contractName: 'AlbumActivity',
        registrationKey: 'albumActivity',
      },
      {
        contractName: 'CommentActivity',
        registrationKey: 'commentActivity',
      },
      {
        contractName: 'ReactionActivity',
        registrationKey: 'reactionActivity',
      },
    ],
  },

  // fastSweepNotificationStrategies
  fastSweepNotificationStrategies: {
    kind: 'collection',
    baseType: 'FastSweepNotificationStrategy',
    baseTypeId:
      '/home/reharik/Development/photoapp-cc/apps/media-worker/src/tasks/schedule/individualNotification/fastSweepNotificationStrategies/types.ts:FastSweepNotificationStrategy',
    members: [
      {
        contractName: 'FastSweepNotificationStrategy',
        registrationKey: 'albumSharedStrategy',
      },
      {
        contractName: 'FastSweepNotificationStrategy',
        registrationKey: 'albumSharedWithNonUserStrategy',
      },
    ],
  },

  // workerTasks
  workerTasks: {
    kind: 'collection',
    baseType: 'WorkerTaskBase',
    baseTypeId:
      '/home/reharik/Development/photoapp-cc/apps/media-worker/src/types.ts:WorkerTaskBase',
    members: [
      {
        contractName: 'FastSweepNotificationTask',
        registrationKey: 'fastSweepNotificationTask',
      },
      {
        contractName: 'MediaDeletionTask',
        registrationKey: 'mediaDeletionTask',
      },
      {
        contractName: 'MediaImageTask',
        registrationKey: 'mediaImageTask',
      },
      {
        contractName: 'NotificationBatchTask',
        registrationKey: 'notificationBatchTask',
      },
      {
        contractName: 'StalledMediaJobSweepTask',
        registrationKey: 'stalledMediaJobSweepTask',
      },
    ],
  },
} as const satisfies IocGeneratedContainerManifest<IocManifestGroupRoots>;

export const IOC_SCOPE_PROVIDED_KEYS = [] as const;
