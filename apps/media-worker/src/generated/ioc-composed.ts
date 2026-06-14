/* AUTO-GENERATED. DO NOT EDIT.
App-mode composition glue. Re-run `ioc generate` after changing factories, composed packages, or IoC config.
*/
import type { ComposedRegistrationOverrides } from 'ioc-manifest';

import { iocManifest as infrastructureManifest } from '@packages/infrastructure/iocManifest';
import { iocManifest as mediaCoreManifest } from '@packages/media-core/iocManifest';
import { iocManifest as localManifest } from './ioc-manifest.js';

import type {
  IocGeneratedCradle as InfrastructureCradle,
  IocExternals as InfrastructureExternals,
} from '@packages/infrastructure/iocTypes';
import type {
  IocGeneratedCradle as MediaCoreCradle,
  IocExternals as MediaCoreExternals,
} from '@packages/media-core/iocTypes';
import type { IocGeneratedCradle as LocalCradle } from './ioc-registry.types.js';

export const composedManifests = [
  localManifest,
  mediaCoreManifest,
  infrastructureManifest,
] as const;

export type AppCradle = LocalCradle & MediaCoreCradle & InfrastructureCradle;

// Compile-time externals satisfaction assertions
type _IocExpect<T extends true> = T;
// If any assertion below is `false`, run `ioc validate` for a detailed per-key explanation.
type _MediaCoreExternalsPick = Pick<AppCradle, keyof MediaCoreExternals>;
type _MediaCore_config = _MediaCoreExternalsPick['config'] extends MediaCoreExternals['config']
  ? true
  : false;
type _MediaCore_configAssert = _IocExpect<_MediaCore_config>;
type _MediaCore_database =
  _MediaCoreExternalsPick['database'] extends MediaCoreExternals['database'] ? true : false;
type _MediaCore_databaseAssert = _IocExpect<_MediaCore_database>;
type _MediaCore_mediaProcessingJobRepository =
  _MediaCoreExternalsPick['mediaProcessingJobRepository'] extends MediaCoreExternals['mediaProcessingJobRepository']
    ? true
    : false;
type _MediaCore_mediaProcessingJobRepositoryAssert =
  _IocExpect<_MediaCore_mediaProcessingJobRepository>;
// If any assertion below is `false`, run `ioc validate` for a detailed per-key explanation.
type _InfrastructureExternalsPick = Pick<AppCradle, keyof InfrastructureExternals>;
type _Infrastructure_config =
  _InfrastructureExternalsPick['config'] extends InfrastructureExternals['config'] ? true : false;
type _Infrastructure_configAssert = _IocExpect<_Infrastructure_config>;

export const composedRegistrationOverrides = {
  composedPackageNames: ['@packages/media-core', '@packages/infrastructure'],
} as const satisfies ComposedRegistrationOverrides;
