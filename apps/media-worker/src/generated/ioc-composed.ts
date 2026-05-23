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
type _MediaCoreExternalsSatisfied =
  MediaCoreExternals extends Pick<AppCradle, keyof MediaCoreExternals> ? true : false;
type _MediaCoreExternalsAssert = _IocExpect<_MediaCoreExternalsSatisfied>;
type _InfrastructureExternalsSatisfied =
  InfrastructureExternals extends Pick<AppCradle, keyof InfrastructureExternals> ? true : false;
type _InfrastructureExternalsAssert = _IocExpect<_InfrastructureExternalsSatisfied>;

export const composedRegistrationOverrides = {
  composedPackageNames: ['@packages/media-core', '@packages/infrastructure'],
} as const satisfies ComposedRegistrationOverrides;
