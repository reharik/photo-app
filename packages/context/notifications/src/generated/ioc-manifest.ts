/* AUTO-GENERATED. DO NOT EDIT.
Primary container manifest.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { IocGeneratedContainerManifest, IocModuleNamespace } from 'ioc-manifest';

import * as ioc_channels_email from '../channels/email.js';
import * as ioc_channels_sms from '../channels/sms.js';
import * as ioc_notificationService from '../notificationService.js';

type IocManifestGroupRoots = {
  readonly channels: {
    readonly kind: 'object';
    readonly baseType: 'Channel';
    readonly baseTypeId: '/home/reharik/Development/photoapp/packages/context/notifications/src/channels/email.ts:Channel';
    readonly members: {
      readonly emailChannel: {
        readonly contractName: 'EmailChannel';
        readonly registrationKey: 'emailChannel';
      };
      readonly smsChannel: {
        readonly contractName: 'SmsChannel';
        readonly registrationKey: 'smsChannel';
      };
    };
  };
};

export const iocManifest = {
  manifestSchemaVersion: 2,

  moduleImports: [
    ioc_channels_email,
    ioc_channels_sms,
    ioc_notificationService,
  ] as const satisfies readonly IocModuleNamespace[],

  contracts: {
    EmailChannel: {
      emailChannel: {
        exportName: 'build__emailChannel',
        registrationKey: 'emailChannel',
        modulePath: 'channels/email.ts',
        relImport: '../channels/email.js',
        contractName: 'EmailChannel',
        implementationName: 'emailChannel',
        lifetime: 'singleton',
        moduleIndex: 0,
        default: true,
        discoveredBy: 'naming',
      },
    },
    NotificationService: {
      notificationService: {
        exportName: 'build__NotificationService',
        registrationKey: 'notificationService',
        modulePath: 'notificationService.ts',
        relImport: '../notificationService.js',
        contractName: 'NotificationService',
        implementationName: 'notificationService',
        lifetime: 'singleton',
        moduleIndex: 2,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SmsChannel: {
      smsChannel: {
        exportName: 'build__smsChannel',
        registrationKey: 'smsChannel',
        modulePath: 'channels/sms.ts',
        relImport: '../channels/sms.js',
        contractName: 'SmsChannel',
        implementationName: 'smsChannel',
        lifetime: 'singleton',
        moduleIndex: 1,
        default: true,
        discoveredBy: 'naming',
      },
    },
  },
  // channels
  channels: {
    kind: 'object',
    baseType: 'Channel',
    baseTypeId:
      '/home/reharik/Development/photoapp/packages/context/notifications/src/channels/email.ts:Channel',
    members: {
      emailChannel: {
        contractName: 'EmailChannel',
        registrationKey: 'emailChannel',
      },
      smsChannel: {
        contractName: 'SmsChannel',
        registrationKey: 'smsChannel',
      },
    },
  },
} as const satisfies IocGeneratedContainerManifest<IocManifestGroupRoots>;

export const IOC_SCOPE_PROVIDED_KEYS = [] as const;
