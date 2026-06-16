import { WriteResult } from '@packages/contracts';
import { getResendClient } from '../client.js';
import { EmailService } from '../emailClient.js';
import { EmailConfig } from '../types';

export type EmailSendInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailSendResult =
  | { ok: true; id: string }
  | { ok: false; error: string; providerDetail?: string };

const buildFrom = (config: EmailChannelConfig): string | null => {
  const address = config.fromEmail.trim();
  const name = config.fromName.trim();
  if (!address) {
    return null;
  }
  if (name) {
    return `${name} <${address}>`;
  }
  return address;
};

export interface Channel {
  readonly __channelBrand?: true;
}

export interface EmailChannel extends Channel {
  sendEmail: (input: EmailSendInput) => Promise<WriteResult<{ messageId: string }>>;
}

export type EmailChannelDeps = {
  config: EmailConfig;
  emailClient: EmailService;
};

export const build__emailChannel = ({ config, emailClient }: EmailChannelDeps): EmailChannel => ({
  sendEmail: async (input: EmailSendInput): Promise<EmailSendResult> => {
    const fromEmail = buildFrom(config);
    if (!fromEmail) {
      return { ok: false, error: 'FROM_EMAIL environment variable is not set' };
    }

    const client = getResendClient();
    if (!client) {
      return { ok: false, error: 'RESEND_API_KEY environment variable is not set' };
    }

    return await emailClient.sendEmail({
      fromEmail,
      to: input.to,
      subject: input.subject,
      body: input.html,
      ...(input.text ? { text: input.text } : {}),
    });
  },
});
