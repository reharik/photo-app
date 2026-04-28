import { render } from '@react-email/render';
import { createElement } from 'react';
import { sendEmail } from './channels/email.js';
import { NotImplementedError, sendSms } from './channels/sms.js';
import { templateRegistry } from './templates/index.js';
import type {
  NotificationChannel,
  NotificationPayload,
  NotifyResult,
  TemplateName,
} from './types.js';

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

const logNotifyFailure = (context: Record<string, unknown>): void => {
  console.error(
    '[@packages/notifications]',
    JSON.stringify({ ...context, timestamp: new Date().toISOString() }),
  );
};

export const notify = async <T extends TemplateName>(
  payload: NotificationPayload<T>,
): Promise<NotifyResult> => {
  const { email, phone } = resolveRecipients(payload.to);
  const channels = resolveChannels(payload.channels, email, phone);

  if (!channels) {
    const error =
      'No recipient address: provide a non-empty email or phone, or pass non-empty `channels`';
    logNotifyFailure({ event: 'notify_invalid_recipient', template: payload.template, error });
    return { success: false, error };
  }

  const ids: string[] = [];

  for (const channel of channels) {
    if (channel === 'email') {
      if (!email) {
        const error = 'Email channel selected but no email address was provided';
        logNotifyFailure({
          event: 'notify_missing_email',
          template: payload.template,
          channel,
          error,
        });
        return { success: false, error };
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
        return { success: false, error: `Template render failed: ${message}` };
      }

      const subject = entry.getSubject(payload.data);
      const result = await sendEmail({ to: email, subject, html });

      if (!result.ok) {
        logNotifyFailure({
          event: 'notify_email_failed',
          template: payload.template,
          recipient: email,
          error: result.error,
          providerDetail: result.providerDetail,
        });
        return { success: false, error: result.error };
      }

      ids.push(result.id);
      continue;
    }

    if (channel === 'sms') {
      if (!phone) {
        const error = 'SMS channel selected but no phone number was provided';
        logNotifyFailure({
          event: 'notify_missing_phone',
          template: payload.template,
          channel,
          error,
        });
        return { success: false, error };
      }

      try {
        const entry = templateRegistry[payload.template];
        const subjectLine = entry.getSubject(payload.data);
        const smsResult = await sendSms({ toPhone: phone, body: subjectLine });
        ids.push(smsResult.id);
      } catch (err: unknown) {
        if (err instanceof NotImplementedError) {
          logNotifyFailure({
            event: 'notify_sms_not_implemented',
            template: payload.template,
            recipient: phone,
            error: err.message,
          });
          return { success: false, error: err.message };
        }
        const message = err instanceof Error ? err.message : String(err);
        logNotifyFailure({
          event: 'notify_sms_failed',
          template: payload.template,
          recipient: phone,
          error: message,
        });
        return { success: false, error: message };
      }
    }
  }

  return { success: true, id: ids.join('|') };
};
