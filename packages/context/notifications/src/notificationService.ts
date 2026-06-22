import { ContractError, WriteResult, fail, ok } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { render } from '@react-email/components';
import { createElement } from 'react';
import { NotImplementedError } from './channels/sms.js';
import { IocGeneratedCradle } from './generated/ioc-registry.types.js';
import { templateRegistry } from './templates/index.js';
import type { NotificationChannel, NotificationPayload, TemplateName } from './types.js';

const resolveRecipients = (
  to: NotificationPayload<TemplateName>['to'],
): {
  email?: string;
  phone?: string;
} => {
  if (typeof to === 'string') {
    const email = to.trim();
    return email ? { email } : {};
  }
  return {
    email: to.email?.trim(),
    phone: to.phone?.trim(),
  };
};

const resolveChannels = (
  channels: NotificationChannel[] | undefined,
  email: string | undefined,
  phone: string | undefined,
): NotificationChannel[] | null => {
  if (channels !== undefined) {
    if (channels.length === 0) {
      return null;
    }
    return channels;
  }
  const out: NotificationChannel[] = [];
  if (email) {
    out.push('email');
  } else if (phone) {
    out.push('sms');
  }
  return out.length > 0 ? out : null;
};

export type NotificationServiceDeps = {
  logger: Logger;
  channels: IocGeneratedCradle['channels'];
};

export interface NotificationService {
  notify: <T extends TemplateName>(payload: NotificationPayload<T>) => Promise<WriteResult<string>>;
}

export const build__NotificationService = ({
  logger,
  channels,
}: NotificationServiceDeps): NotificationService => {
  const logNotifyFailure = (context: Record<string, unknown>): void => {
    logger.error(
      `[@packages/notifications] ${JSON.stringify({
        ...context,
        timestamp: new Date().toISOString(),
      })}`,
    );
  };

  return {
    notify: async <T extends TemplateName>(
      payload: NotificationPayload<T>,
    ): Promise<WriteResult<string>> => {
      const { email, phone } = resolveRecipients(payload.to);
      const availableChannels = resolveChannels(payload.channels, email, phone);

      if (!availableChannels) {
        const error =
          'No recipient address: provide a non-empty email or phone, or pass non-empty `channels`';
        logNotifyFailure({ event: 'notify_invalid_recipient', template: payload.template, error });
        return fail(ContractError.noNotificationChannelsAvailable);
      }
      const ids: string[] = [];

      for (const channel of availableChannels) {
        if (channel === 'email') {
          if (!email) {
            const error = 'Email channel selected but no email address was provided';
            logNotifyFailure({
              event: 'notify_missing_email',
              template: payload.template,
              channel,
              error,
            });
            return fail(ContractError.noRecipientsProvided);
          }

          const entry = templateRegistry[payload.template];
          let html: string;
          try {
            html = await render(createElement(entry.Component, payload.data));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            logNotifyFailure({
              event: 'notify_render_failed',
              template: payload.template,
              recipient: email,
              error: message,
            });
            return fail(ContractError.EmailSendFailed);
          }

          const subject = entry.getSubject(payload.data);
          const result = await channels.emailChannel.sendEmail({ to: email, subject, html });

          if (!result.success) {
            logNotifyFailure({
              event: 'notify_email_failed',
              template: payload.template,
              recipient: email,
              error: result.error.display,
            });
            return fail(ContractError.EmailSendFailed);
          }

          ids.push(result.value.messageId);
          continue;
        }

        if (availableChannels.includes('sms')) {
          if (!phone) {
            const error = 'SMS channel selected but no phone number was provided';
            logNotifyFailure({
              event: 'notify_missing_phone',
              template: payload.template,
              channel,
              error,
            });
            return fail(ContractError.SmsNotConfigured);
          }

          try {
            const entry = templateRegistry[payload.template];
            const subjectLine = entry.getSubject(payload.data);
            const smsResult = await channels.smsChannel.sendSms({
              toPhone: phone,
              body: subjectLine,
            });
            if (smsResult.success) {
              ids.push(smsResult.value.id);
            } else {
              logNotifyFailure({
                event: 'notify_sms_failed',
                template: payload.template,
                recipient: phone,
                error: smsResult.error.display,
              });
              return fail(ContractError.SmsNotConfigured);
            }
          } catch (err: unknown) {
            if (err instanceof NotImplementedError) {
              logNotifyFailure({
                event: 'notify_sms_not_implemented',
                template: payload.template,
                recipient: phone,
                error: err.message,
              });
              return fail(ContractError.SmsNotConfigured);
            }
            const message = err instanceof Error ? err.message : String(err);
            logNotifyFailure({
              event: 'notify_sms_failed',
              template: payload.template,
              recipient: phone,
              error: message,
            });
            return fail(ContractError.SmsNotConfigured);
          }
        }
      }

      return ok(ids.join('|'));
    },
  };
};
