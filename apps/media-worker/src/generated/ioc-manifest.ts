/* AUTO-GENERATED. DO NOT EDIT.
Primary container manifest.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { IocGeneratedContainerManifest, IocModuleNamespace } from 'ioc-manifest';

import * as ioc_config from '../config.js';
import * as ioc_knex from '../knex.js';
import * as ioc_knexfile from '../knexfile.js';
import * as ioc_runMediaWorkerLoop from '../runMediaWorkerLoop.js';
import * as ioc_tasks_mediaWorkers_mediaWorkerTasks from '../tasks/mediaWorkers/mediaWorkerTasks.js';
import * as ioc_tasks_mediaWorkers_processNextMediaDeletionJob from '../tasks/mediaWorkers/processNextMediaDeletionJob.js';
import * as ioc_tasks_mediaWorkers_processNextMediaImageJob from '../tasks/mediaWorkers/processNextMediaImageJob.js';
import * as ioc_tasks_notificationWorkers_notificationBatcher from '../tasks/notificationWorkers/notificationBatcher.js';
import * as ioc_tasks_notificationWorkers_notificationBatchTask from '../tasks/notificationWorkers/notificationBatchTask.js';

type IocManifestGroupRoots = {
  readonly workerTasks: {
    readonly kind: 'collection';
    readonly baseType: 'WorkerTask';
    readonly baseTypeId: '/home/reharik/Development/photoapp/apps/media-worker/src/types.ts:WorkerTask';
    readonly members: readonly [
      { readonly contractName: 'WorkerTask'; readonly registrationKey: 'mediaDeletionTask' },
      { readonly contractName: 'WorkerTask'; readonly registrationKey: 'mediaImageTask' },
      { readonly contractName: 'WorkerTask'; readonly registrationKey: 'notificationSweepTask' },
    ];
  };
};

export const iocManifest = {
  manifestSchemaVersion: 2,

  moduleImports: [
    ioc_config,
    ioc_knex,
    ioc_knexfile,
    ioc_runMediaWorkerLoop,
    ioc_tasks_mediaWorkers_mediaWorkerTasks,
    ioc_tasks_mediaWorkers_processNextMediaDeletionJob,
    ioc_tasks_mediaWorkers_processNextMediaImageJob,
    ioc_tasks_notificationWorkers_notificationBatcher,
    ioc_tasks_notificationWorkers_notificationBatchTask,
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
    Knex: {
      database: {
        exportName: 'build__Database',
        registrationKey: 'database',
        modulePath: 'knex.ts',
        relImport: '../knex.js',
        contractName: 'Knex',
        implementationName: 'database',
        lifetime: 'singleton',
        moduleIndex: 1,
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
        moduleIndex: 2,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    NotificationBatcher: {
      notificationBatcher: {
        exportName: 'build__NotificationBatcher',
        registrationKey: 'notificationBatcher',
        modulePath: 'tasks/notificationWorkers/notificationBatcher.ts',
        relImport: '../tasks/notificationWorkers/notificationBatcher.js',
        contractName: 'NotificationBatcher',
        implementationName: 'notificationBatcher',
        lifetime: 'singleton',
        moduleIndex: 7,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    ProcessNextMediaDeletionJob: {
      processNextMediaDeletionJob: {
        exportName: 'build__ProcessNextMediaDeletionJob',
        registrationKey: 'processNextMediaDeletionJob',
        modulePath: 'tasks/mediaWorkers/processNextMediaDeletionJob.ts',
        relImport: '../tasks/mediaWorkers/processNextMediaDeletionJob.js',
        contractName: 'ProcessNextMediaDeletionJob',
        implementationName: 'processNextMediaDeletionJob',
        lifetime: 'scoped',
        moduleIndex: 5,
        default: true,
        discoveredBy: 'naming',
      },
    },
    ProcessNextMediaImageJob: {
      processNextMediaImageJob: {
        exportName: 'build__ProcessNextMediaImageJob',
        registrationKey: 'processNextMediaImageJob',
        modulePath: 'tasks/mediaWorkers/processNextMediaImageJob.ts',
        relImport: '../tasks/mediaWorkers/processNextMediaImageJob.js',
        contractName: 'ProcessNextMediaImageJob',
        implementationName: 'processNextMediaImageJob',
        lifetime: 'scoped',
        moduleIndex: 6,
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
        moduleIndex: 3,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    RunNextMediaDeletionJob: {
      runNextMediaDeletionJob: {
        exportName: 'build__RunNextMediaDeletionJob',
        registrationKey: 'runNextMediaDeletionJob',
        modulePath: 'tasks/mediaWorkers/processNextMediaDeletionJob.ts',
        relImport: '../tasks/mediaWorkers/processNextMediaDeletionJob.js',
        contractName: 'RunNextMediaDeletionJob',
        implementationName: 'runNextMediaDeletionJob',
        lifetime: 'singleton',
        moduleIndex: 5,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    RunNextMediaImageJob: {
      runNextMediaImageJob: {
        exportName: 'build__RunNextMediaImageJob',
        registrationKey: 'runNextMediaImageJob',
        modulePath: 'tasks/mediaWorkers/processNextMediaImageJob.ts',
        relImport: '../tasks/mediaWorkers/processNextMediaImageJob.js',
        contractName: 'RunNextMediaImageJob',
        implementationName: 'runNextMediaImageJob',
        lifetime: 'singleton',
        moduleIndex: 6,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    WorkerTask: {
      mediaDeletionTask: {
        exportName: 'build__MediaDeletionTask',
        registrationKey: 'mediaDeletionTask',
        modulePath: 'tasks/mediaWorkers/mediaWorkerTasks.ts',
        relImport: '../tasks/mediaWorkers/mediaWorkerTasks.js',
        contractName: 'WorkerTask',
        implementationName: 'mediaDeletionTask',
        lifetime: 'singleton',
        moduleIndex: 4,
        discoveredBy: 'naming',
        dependencyContractNames: ['RunNextMediaDeletionJob'],
      },
      mediaImageTask: {
        exportName: 'build__MediaImageTask',
        registrationKey: 'mediaImageTask',
        modulePath: 'tasks/mediaWorkers/mediaWorkerTasks.ts',
        relImport: '../tasks/mediaWorkers/mediaWorkerTasks.js',
        contractName: 'WorkerTask',
        implementationName: 'mediaImageTask',
        lifetime: 'singleton',
        moduleIndex: 4,
        discoveredBy: 'naming',
        dependencyContractNames: ['RunNextMediaImageJob'],
      },
      notificationSweepTask: {
        exportName: 'build__NotificationSweepTask',
        registrationKey: 'notificationSweepTask',
        modulePath: 'tasks/notificationWorkers/notificationBatchTask.ts',
        relImport: '../tasks/notificationWorkers/notificationBatchTask.js',
        contractName: 'WorkerTask',
        implementationName: 'notificationSweepTask',
        lifetime: 'singleton',
        moduleIndex: 8,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['default'],
        dependencyContractNames: ['Config', 'NotificationBatcher'],
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
        registrationKey: 'mediaDeletionTask',
      },
      {
        contractName: 'WorkerTask',
        registrationKey: 'mediaImageTask',
      },
      {
        contractName: 'WorkerTask',
        registrationKey: 'notificationSweepTask',
      },
    ],
  },
} as const satisfies IocGeneratedContainerManifest<IocManifestGroupRoots>;

export const IOC_SCOPE_PROVIDED_KEYS = [] as const;
