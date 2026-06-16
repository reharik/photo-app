import { SendRawEmailCommand, SESClient, SESClientConfig } from '@aws-sdk/client-ses';
import { ContractError, fail, WriteResult } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { EmailConfig } from './types';

export interface EmailService {
  sendEmail: (
    to: string,
    subject: string,
    body: string,
    fromEmail: string,
    fromDisplayName?: string,
    replyToEmail?: string,
    bcc?: string,
  ) => Promise<WriteResult<{ messageId: string }>>;
}

export type EmailClientDeps = {
  logger: Logger;
  config: EmailConfig;
};

export type EmailClientConfig = {
  awsRegion: string;
};

export const build__EmailClient = ({ logger, config }: EmailClientDeps): EmailService => {
  // Use default credential chain (IAM roles on ECS/EC2/Lambda, AWS_ACCESS_KEY_ID env, ~/.aws/credentials).
  // Do not pass credentials so the SDK resolves them automatically.
  if (!config.awsEndpoint) {
    logger.info(
      'Using AWS default credential chain for SES (IAM roles, environment variables, or shared config).',
    );
  }

  const sesClientConfig: SESClientConfig = {
    region: config.awsRegion,
    endpoint: config.awsEndpoint, // Will be undefined in production, LocalStack URL in development
  };

  const sesClient = new SESClient(sesClientConfig);

  return {
    sendEmail: async (
      to: string,
      subject: string,
      body: string,
      fromEmail: string,
      fromDisplayName?: string,
      replyToEmail?: string,
      bcc?: string,
    ): Promise<WriteResult<{ messageId: string }>> => {
      logger.info('Sending email', {
        to,
        subject,
        from: fromEmail,
        fromDisplayName,
        replyTo: replyToEmail,
        bcc: bcc ?? undefined,
      });

      try {
        // Build raw email with headers
        const headers: string[] = [];

        if (fromDisplayName) {
          const safeName = fromDisplayName.replace(/"/g, '\\"');
          headers.push(`From: "${safeName}" <${fromEmail}>`);
        } else {
          headers.push(`From: ${fromEmail}`);
        }

        headers.push(`To: ${to}`);

        if (replyToEmail) {
          headers.push(`Reply-To: ${replyToEmail}`);
        }

        if (bcc) {
          headers.push(`Bcc: ${bcc}`);
        }

        headers.push(`Subject: ${subject}`);
        headers.push('MIME-Version: 1.0');
        headers.push('Content-Type: text/plain; charset=UTF-8');

        const rawEmail = headers.join('\r\n') + '\r\n\r\n' + body;
        const rawMessage = Buffer.from(rawEmail, 'utf-8');

        const command = new SendRawEmailCommand({
          Source: fromEmail, // IMPORTANT: bare email for SES identity check
          RawMessage: { Data: rawMessage },
        });

        const result = await sesClient.send(command);

        const messageId = result.MessageId || 'unknown';
        logger.info('Email sent successfully', {
          to,
          subject,
          messageId,
          from: fromEmail,
          fromDisplayName,
          replyTo: replyToEmail,
        });
        return ok({ messageId });
      } catch (error) {
        logger.error('Error sending email', { error });
      }
      return fail(ContractError.EMAIL_SEND_FAILED);
    },
  };
};
