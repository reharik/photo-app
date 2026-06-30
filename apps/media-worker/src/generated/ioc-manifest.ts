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
import * as ioc_tasks_schedule_batchNotification_notificationBatcher from '../tasks/schedule/batchNotification/notificationBatcher.js';
import * as ioc_tasks_schedule_batchNotification_notificationBatchTask from '../tasks/schedule/batchNotification/notificationBatchTask.js';
import * as ioc_tasks_schedule_individualNotification_fastSweepNotification from '../tasks/schedule/individualNotification/fastSweepNotification.js';
import * as ioc_tasks_schedule_individualNotification_fastSweepNotificationTask from '../tasks/schedule/individualNotification/fastSweepNotificationTask.js';

type IocManifestGroupRoots = {
  readonly workerTasks: {
    readonly kind: 'collection';
    readonly baseType: 'WorkerTask';
    readonly baseTypeId: '/home/reharik/Development/photoapp/apps/media-worker/src/types.ts:WorkerTask';
    readonly members: readonly [
      {
        readonly contractName: 'WorkerTask';
        readonly registrationKey: 'fastSweepNotificationTask';
      },
      { readonly contractName: 'WorkerTask'; readonly registrationKey: 'mediaDeletionTask' },
      { readonly contractName: 'WorkerTask'; readonly registrationKey: 'mediaImageTask' },
      { readonly contractName: 'WorkerTask'; readonly registrationKey: 'notificationBatchTask' },
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
    ioc_tasks_schedule_batchNotification_notificationBatcher,
    ioc_tasks_schedule_batchNotification_notificationBatchTask,
    ioc_tasks_schedule_individualNotification_fastSweepNotification,
    ioc_tasks_schedule_individualNotification_fastSweepNotificationTask,
  ] as const satisfies readonly IocModuleNamespace[],

  contracts: {
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
        moduleIndex: 10,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
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
    NotificationBatcher: {
      notificationBatcher: {
        exportName: 'build__NotificationBatcher',
        registrationKey: 'notificationBatcher',
        modulePath: 'tasks/schedule/batchNotification/notificationBatcher.ts',
        relImport: '../tasks/schedule/batchNotification/notificationBatcher.js',
        contractName: 'NotificationBatcher',
        implementationName: 'notificationBatcher',
        lifetime: 'singleton',
        moduleIndex: 8,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
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
    WorkerTask: {
      fastSweepNotificationTask: {
        exportName: 'build__FastSweepNotificationTask',
        registrationKey: 'fastSweepNotificationTask',
        modulePath: 'tasks/schedule/individualNotification/fastSweepNotificationTask.ts',
        relImport: '../tasks/schedule/individualNotification/fastSweepNotificationTask.js',
        contractName: 'WorkerTask',
        implementationName: 'fastSweepNotificationTask',
        lifetime: 'singleton',
        moduleIndex: 11,
        discoveredBy: 'naming',
        dependencyContractNames: ['FastSweepNotification'],
      },
      mediaDeletionTask: {
        exportName: 'build__MediaDeletionTask',
        registrationKey: 'mediaDeletionTask',
        modulePath: 'tasks/queue/mediaWorkers/mediaWorkerTasks.ts',
        relImport: '../tasks/queue/mediaWorkers/mediaWorkerTasks.js',
        contractName: 'WorkerTask',
        implementationName: 'mediaDeletionTask',
        lifetime: 'singleton',
        moduleIndex: 5,
        discoveredBy: 'naming',
        dependencyContractNames: ['RunNextMediaDeletionJob'],
      },
      mediaImageTask: {
        exportName: 'build__MediaImageTask',
        registrationKey: 'mediaImageTask',
        modulePath: 'tasks/queue/mediaWorkers/mediaWorkerTasks.ts',
        relImport: '../tasks/queue/mediaWorkers/mediaWorkerTasks.js',
        contractName: 'WorkerTask',
        implementationName: 'mediaImageTask',
        lifetime: 'singleton',
        moduleIndex: 5,
        discoveredBy: 'naming',
        dependencyContractNames: ['RunNextMediaImageJob'],
      },
      notificationBatchTask: {
        exportName: 'build__NotificationBatchTask',
        registrationKey: 'notificationBatchTask',
        modulePath: 'tasks/schedule/batchNotification/notificationBatchTask.ts',
        relImport: '../tasks/schedule/batchNotification/notificationBatchTask.js',
        contractName: 'WorkerTask',
        implementationName: 'notificationBatchTask',
        lifetime: 'singleton',
        moduleIndex: 9,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['default'],
        dependencyContractNames: ['NotificationBatcher'],
      },
    },
  },
  // workerTasks
  workerTasks: {
    kind: 'collection',
    baseType: 'WorkerTask',
    baseTypeId: '/home/reharik/Development/photoapp/apps/media-worker/src/types.ts:WorkerTask',
    members: [
      {
        contractName: 'WorkerTask',
        registrationKey: 'fastSweepNotificationTask',
      },
      {
        contractName: 'WorkerTask',
        registrationKey: 'mediaDeletionTask',
      },
      {
        contractName: 'WorkerTask',
        registrationKey: 'mediaImageTask',
      },
      {
        contractName: 'WorkerTask',
        registrationKey: 'notificationBatchTask',
      },
    ],
  },
} as const satisfies IocGeneratedContainerManifest<IocManifestGroupRoots>;

export const IOC_SCOPE_PROVIDED_KEYS = [] as const;
