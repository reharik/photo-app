import { beforeAll, describe, expect, it } from '@jest/globals';
import type { Logger } from '@packages/infrastructure';
import { isLocalStackAvailable } from '../test/localstack.js';

const logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  http: () => undefined,
  verbose: () => undefined,
} satisfies Logger;

describe('LocalStack email integration', () => {
  let localStackAvailable = false;
  let build__EmailClient: typeof import('../emailClient.js').build__EmailClient;
  let build__EmailChannel: typeof import('../channels/email.js').build__EmailChannel;

  beforeAll(async () => {
    localStackAvailable = await isLocalStackAvailable();
    ({ build__EmailClient } = await import('../emailClient.js'));
    ({ build__EmailChannel } = await import('../channels/email.js'));
  });

  describe('When LocalStack SES is running', () => {
    it('should send HTML email through the SES client and channel', async () => {
      if (!localStackAvailable) {
        return;
      }

      const emailConfig = {
        fromEmail: 'test@example.com',
        fromName: 'BetanaMe Dev',
        awsRegion: 'us-east-1',
        awsEndpoint: process.env.AWS_ENDPOINT?.trim() || 'http://localhost:4566',
      };

      const emailClient = build__EmailClient({ logger, config: emailConfig });
      const emailChannel = build__EmailChannel({ config: emailConfig, emailClient });

      const result = await emailChannel.sendEmail({
        to: 'recipient@example.com',
        subject: 'LocalStack integration test',
        html: '<html><body><p>LocalStack SES works</p></body></html>',
        text: 'LocalStack SES works',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.messageId.length).toBeGreaterThan(0);
      }
    });
  });
});
