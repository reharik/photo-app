import { SendRawEmailCommand, SESClient, SESClientConfig } from '@aws-sdk/client-ses';
import { ContractError, fail, ok, WriteResult } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { EmailConfig } from './types';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  fromEmail: string;
  fromDisplayName?: string;
  replyToEmail?: string;
  bcc?: string;
  text?: string;
};

export interface EmailService {
  sendEmail: (input: SendEmailInput) => Promise<WriteResult<{ messageId: string }>>;
}

export type EmailClientDeps = {
  logger: Logger;
  config: EmailConfig;
};

const buildFromHeader = (fromEmail: string, fromDisplayName?: string): string => {
  if (fromDisplayName) {
    const safeName = fromDisplayName.replace(/"/g, '\\"');
    return `"${safeName}" <${fromEmail}>`;
  }
  return fromEmail;
};

// Use default credential chain (IAM roles on ECS/EC2/Lambda, AWS_ACCESS_KEY_ID env, ~/.aws/credentials).
// Do not pass credentials so the SDK resolves them automatically.
const buildRawEmail = (input: SendEmailInput): Buffer => {
  const headers: string[] = [
    `From: ${buildFromHeader(input.fromEmail, input.fromDisplayName)}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    'MIME-Version: 1.0',
  ];

  if (input.replyToEmail) {
    headers.push(`Reply-To: ${input.replyToEmail}`);
  }

  if (input.bcc) {
    headers.push(`Bcc: ${input.bcc}`);
  }

  const plainText = input.text?.trim();
  if (plainText) {
    const boundary = `boundary_${Date.now()}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    const body = [
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      plainText,
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      input.html,
      `--${boundary}--`,
    ].join('\r\n');
    return Buffer.from(`${headers.join('\r\n')}\r\n\r\n${body}`, 'utf-8');
  }

  headers.push('Content-Type: text/html; charset=UTF-8');
  return Buffer.from(`${headers.join('\r\n')}\r\n\r\n${input.html}`, 'utf-8');
};

export const build__EmailClient = ({ logger, config }: EmailClientDeps): EmailService => {
  if (!config.awsEndpoint) {
    logger.info(
      'Using AWS default credential chain for SES (IAM roles, environment variables, or shared config).',
    );
  } else {
    logger.info('Using LocalStack SES endpoint for email delivery.', {
      endpoint: config.awsEndpoint,
    });
  }

  const sesClientConfig: SESClientConfig = {
    region: config.awsRegion,
    endpoint: config.awsEndpoint, // Will be undefined in production, LocalStack URL in development
    ...(config.awsEndpoint
      ? {
          credentials: {
            accessKeyId: 'test',
            secretAccessKey: 'test',
          },
        }
      : {}),
  };

  const sesClient = new SESClient(sesClientConfig);

  return {
    sendEmail: async (input: SendEmailInput): Promise<WriteResult<{ messageId: string }>> => {
      logger.info('Sending email', {
        to: input.to,
        subject: input.subject,
        from: input.fromEmail,
        fromDisplayName: input.fromDisplayName,
        replyTo: input.replyToEmail,
        bcc: input.bcc ?? undefined,
      });

      try {
        const rawMessage = buildRawEmail(input);
        const command = new SendRawEmailCommand({
          Source: input.fromEmail, // IMPORTANT: bare email for SES identity check
          RawMessage: { Data: rawMessage },
        });

        const result = await sesClient.send(command);
        const messageId = result.MessageId || 'unknown';

        logger.info('Email sent successfully', {
          to: input.to,
          subject: input.subject,
          messageId,
          from: input.fromEmail,
          fromDisplayName: input.fromDisplayName,
          replyTo: input.replyToEmail,
        });

        return ok({ messageId });
      } catch (error) {
        logger.error('Error sending email', {
          to: input.to,
          subject: input.subject,
          error,
        });
        return fail(ContractError.EmailSendFailed);
      }
    },
  };
};
