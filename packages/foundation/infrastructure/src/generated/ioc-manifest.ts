/* AUTO-GENERATED. DO NOT EDIT.
Primary container manifest.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { IocGeneratedContainerManifest, IocModuleNamespace } from 'ioc-manifest';

import * as ioc_logger_coreLogger from '../logger/coreLogger.js';
import * as ioc_rateLimiter_rateLimiter from '../rateLimiter/rateLimiter.js';

export const iocManifest = {
  manifestSchemaVersion: 2,

  moduleImports: [
    ioc_logger_coreLogger,
    ioc_rateLimiter_rateLimiter,
  ] as const satisfies readonly IocModuleNamespace[],

  contracts: {
    Logger: {
      logger: {
        exportName: 'build__Logger',
        registrationKey: 'logger',
        modulePath: 'logger/coreLogger.ts',
        relImport: '../logger/coreLogger.js',
        contractName: 'Logger',
        implementationName: 'logger',
        lifetime: 'singleton',
        moduleIndex: 0,
        default: true,
        discoveredBy: 'naming',
      },
    },
    RateLimiter: {
      rateLimiter: {
        exportName: 'build__RateLimiter',
        registrationKey: 'rateLimiter',
        modulePath: 'rateLimiter/rateLimiter.ts',
        relImport: '../rateLimiter/rateLimiter.js',
        contractName: 'RateLimiter',
        implementationName: 'rateLimiter',
        lifetime: 'singleton',
        moduleIndex: 1,
        default: true,
        discoveredBy: 'naming',
      },
    },
  },
} as const satisfies IocGeneratedContainerManifest;

export const IOC_SCOPE_PROVIDED_KEYS = [] as const;
