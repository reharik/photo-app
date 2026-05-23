/* AUTO-GENERATED. DO NOT EDIT.
Primary container manifest.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { IocGeneratedContainerManifest, IocModuleNamespace } from 'ioc-manifest';

import * as ioc_logger_coreLogger from '../logger/coreLogger.js';

export const iocManifest = {
  manifestSchemaVersion: 2,

  moduleImports: [ioc_logger_coreLogger] as const satisfies readonly IocModuleNamespace[],

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
  },
} as const satisfies IocGeneratedContainerManifest;
