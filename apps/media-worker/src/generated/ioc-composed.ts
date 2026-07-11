/* AUTO-GENERATED. DO NOT EDIT.
App-mode composition glue. Re-run `ioc generate` after changing factories, composed packages, or IoC config.
*/
import type { ComposedRegistrationOverrides } from 'ioc-manifest';

import { iocManifest as infrastructureManifest } from '@packages/infrastructure/iocManifest';
import { iocManifest as mediaCoreManifest } from '@packages/media-core/iocManifest';
import { iocManifest as notificationsManifest } from '@packages/notifications/iocManifest';
import { iocManifest as localManifest } from './ioc-manifest.js';

import type {
  IocGeneratedCradle as InfrastructureCradle,
  IocExternals as InfrastructureExternals,
} from '@packages/infrastructure/iocTypes';
import type {
  IocGeneratedCradle as MediaCoreCradle,
  IocExternals as MediaCoreExternals,
} from '@packages/media-core/iocTypes';
import type {
  IocGeneratedCradle as NotificationsCradle,
  IocExternals as NotificationsExternals,
} from '@packages/notifications/iocTypes';
import type { IocGeneratedCradle as LocalCradle } from './ioc-registry.types.js';

export const composedManifests = [
  localManifest,
  mediaCoreManifest,
  infrastructureManifest,
  notificationsManifest,
] as const;

export type AppCradle = LocalCradle & MediaCoreCradle & InfrastructureCradle & NotificationsCradle;

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
type _MediaCore_logger = _MediaCoreExternalsPick['logger'] extends MediaCoreExternals['logger']
  ? true
  : false;
type _MediaCore_loggerAssert = _IocExpect<_MediaCore_logger>;
// If any assertion below is `false`, run `ioc validate` for a detailed per-key explanation.
type _InfrastructureExternalsPick = Pick<AppCradle, keyof InfrastructureExternals>;
type _Infrastructure_config =
  _InfrastructureExternalsPick['config'] extends InfrastructureExternals['config'] ? true : false;
type _Infrastructure_configAssert = _IocExpect<_Infrastructure_config>;
type _Infrastructure_database =
  _InfrastructureExternalsPick['database'] extends InfrastructureExternals['database']
    ? true
    : false;
type _Infrastructure_databaseAssert = _IocExpect<_Infrastructure_database>;
// If any assertion below is `false`, run `ioc validate` for a detailed per-key explanation.
type _NotificationsExternalsPick = Pick<AppCradle, keyof NotificationsExternals>;
type _Notifications_config =
  _NotificationsExternalsPick['config'] extends NotificationsExternals['config'] ? true : false;
type _Notifications_configAssert = _IocExpect<_Notifications_config>;
type _Notifications_logger =
  _NotificationsExternalsPick['logger'] extends NotificationsExternals['logger'] ? true : false;
type _Notifications_loggerAssert = _IocExpect<_Notifications_logger>;

export const composedRegistrationOverrides = {
  composedPackageNames: [
    '@packages/media-core',
    '@packages/infrastructure',
    '@packages/notifications',
  ],
} as const satisfies ComposedRegistrationOverrides;
