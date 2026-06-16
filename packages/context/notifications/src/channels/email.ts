import { ContractError, fail, WriteResult } from '@packages/contracts';
import { EmailService } from '../emailClient.js';
import { EmailConfig } from '../types.js';

export type EmailSendInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
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

export const build__EmailChannel = ({ config, emailClient }: EmailChannelDeps): EmailChannel => ({
  sendEmail: async (input: EmailSendInput): Promise<WriteResult<{ messageId: string }>> => {
    const fromEmail = config.fromEmail.trim();
    if (!fromEmail) {
      return fail(ContractError.EmailNotConfigured);
    }

    const fromDisplayName = config.fromName.trim() || undefined;

    return emailClient.sendEmail({
      to: input.to,
      subject: input.subject,
      html: input.html,
      fromEmail,
      fromDisplayName,
      ...(input.text ? { text: input.text } : {}),
    });
  },
});
