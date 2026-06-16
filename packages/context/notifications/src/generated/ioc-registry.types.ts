/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { Logger } from '@packages/infrastructure';
import type { EmailChannel } from '../channels/email.js';
import type { SmsChannel } from '../channels/sms.js';
import type { EmailService } from '../emailClient.js';
import type { NotificationService } from '../notificationService.js';
import type { EmailConfig } from '../types.js';

export interface IocGeneratedCradle {
  channels: {
    emailChannel: EmailChannel;
    smsChannel: SmsChannel;
  };
  emailChannel: EmailChannel;
  emailClient: EmailService;
  emailService: EmailService;
  notificationService: NotificationService;
  smsChannel: SmsChannel;
}

export interface IocExternals {
  config: EmailConfig;
  logger: Logger;
}

export interface IocScopeProvided {}
