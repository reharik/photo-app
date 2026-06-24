/* AUTO-GENERATED. DO NOT EDIT.
Primary container manifest.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { IocGeneratedContainerManifest, IocModuleNamespace } from 'ioc-manifest';

import * as ioc_application_processNextMediaDeletionJob from '../application/processNextMediaDeletionJob.js';
import * as ioc_application_processNextMediaImageJob from '../application/processNextMediaImageJob.js';
import * as ioc_config from '../config.js';
import * as ioc_knex from '../knex.js';
import * as ioc_knexfile from '../knexfile.js';
import * as ioc_repositories_domainRepositories_mediaDeletionJobRepository from '../repositories/domainRepositories/mediaDeletionJobRepository.js';
import * as ioc_repositories_domainRepositories_mediaProcessingJobRepository from '../repositories/domainRepositories/mediaProcessingJobRepository.js';
import * as ioc_runMediaWorkerLoop from '../runMediaWorkerLoop.js';

export const iocManifest = {
  manifestSchemaVersion: 2,

  moduleImports: [
    ioc_application_processNextMediaDeletionJob,
    ioc_application_processNextMediaImageJob,
    ioc_config,
    ioc_knex,
    ioc_knexfile,
    ioc_repositories_domainRepositories_mediaDeletionJobRepository,
    ioc_repositories_domainRepositories_mediaProcessingJobRepository,
    ioc_runMediaWorkerLoop,
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
        moduleIndex: 2,
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
        moduleIndex: 3,
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
        moduleIndex: 4,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    MediaDeletionJobRepository: {
      mediaDeletionJobRepository: {
        exportName: 'build__MediaDeletionJobRepository',
        registrationKey: 'mediaDeletionJobRepository',
        modulePath: 'repositories/domainRepositories/mediaDeletionJobRepository.ts',
        relImport: '../repositories/domainRepositories/mediaDeletionJobRepository.js',
        contractName: 'MediaDeletionJobRepository',
        implementationName: 'mediaDeletionJobRepository',
        lifetime: 'singleton',
        moduleIndex: 5,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Knex'],
      },
    },
    MediaProcessingJobRepository: {
      mediaProcessingJobRepository: {
        exportName: 'build__MediaProcessingJobRepository',
        registrationKey: 'mediaProcessingJobRepository',
        modulePath: 'repositories/domainRepositories/mediaProcessingJobRepository.ts',
        relImport: '../repositories/domainRepositories/mediaProcessingJobRepository.js',
        contractName: 'MediaProcessingJobRepository',
        implementationName: 'mediaProcessingJobRepository',
        lifetime: 'singleton',
        moduleIndex: 6,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Knex'],
      },
    },
    ProcessNextMediaDeletionJob: {
      processNextMediaDeletionJob: {
        exportName: 'build__ProcessNextMediaDeletionJob',
        registrationKey: 'processNextMediaDeletionJob',
        modulePath: 'application/processNextMediaDeletionJob.ts',
        relImport: '../application/processNextMediaDeletionJob.js',
        contractName: 'ProcessNextMediaDeletionJob',
        implementationName: 'processNextMediaDeletionJob',
        lifetime: 'scoped',
        moduleIndex: 0,
        default: true,
        discoveredBy: 'naming',
      },
    },
    ProcessNextMediaImageJob: {
      processNextMediaImageJob: {
        exportName: 'build__ProcessNextMediaImageJob',
        registrationKey: 'processNextMediaImageJob',
        modulePath: 'application/processNextMediaImageJob.ts',
        relImport: '../application/processNextMediaImageJob.js',
        contractName: 'ProcessNextMediaImageJob',
        implementationName: 'processNextMediaImageJob',
        lifetime: 'scoped',
        moduleIndex: 1,
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
        moduleIndex: 7,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config', 'RunNextMediaDeletionJob', 'RunNextMediaImageJob'],
      },
    },
    RunNextMediaDeletionJob: {
      runNextMediaDeletionJob: {
        exportName: 'build__RunNextMediaDeletionJob',
        registrationKey: 'runNextMediaDeletionJob',
        modulePath: 'application/processNextMediaDeletionJob.ts',
        relImport: '../application/processNextMediaDeletionJob.js',
        contractName: 'RunNextMediaDeletionJob',
        implementationName: 'runNextMediaDeletionJob',
        lifetime: 'singleton',
        moduleIndex: 0,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config', 'MediaDeletionJobRepository'],
      },
    },
    RunNextMediaImageJob: {
      runNextMediaImageJob: {
        exportName: 'build__RunNextMediaImageJob',
        registrationKey: 'runNextMediaImageJob',
        modulePath: 'application/processNextMediaImageJob.ts',
        relImport: '../application/processNextMediaImageJob.js',
        contractName: 'RunNextMediaImageJob',
        implementationName: 'runNextMediaImageJob',
        lifetime: 'singleton',
        moduleIndex: 1,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config', 'MediaProcessingJobRepository'],
      },
    },
  },
} as const satisfies IocGeneratedContainerManifest;

export const IOC_SCOPE_PROVIDED_KEYS = [] as const;
