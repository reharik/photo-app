import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContractError } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';

const mockSend = jest.fn<() => Promise<{ MessageId?: string }>>();

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
} satisfies Logger;

describe('build__EmailClient', () => {
  let build__EmailClient: typeof import('../emailClient.js').build__EmailClient;

  beforeAll(async () => {
    jest.unstable_mockModule('@aws-sdk/client-ses', () => ({
      SESClient: class {
        send = mockSend;
      },
      SendRawEmailCommand: class {
        public readonly input: unknown;

        public constructor(input: unknown) {
          this.input = input;
        }
      },
    }));

    ({ build__EmailClient } = await import('../emailClient.js'));
  });

  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('When SES accepts the message', () => {
    it('should return the provider message id', async () => {
      mockSend.mockResolvedValue({ MessageId: 'msg-123' });

      const emailClient = build__EmailClient({
        logger,
        emailConfig: {
          fromEmail: 'sender@example.com',
          fromName: 'PhotoApp',
          awsRegion: 'us-east-1',
          awsEndpoint: 'http://localhost:4566',
        },
      });

      const result = await emailClient.sendEmail({
        to: 'recipient@example.com',
        subject: 'Hello',
        html: '<p>Welcome</p>',
        fromEmail: 'sender@example.com',
        fromDisplayName: 'PhotoApp',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.messageId).toBe('msg-123');
      }
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('When SES rejects the message', () => {
    it('should return EmailSendFailed', async () => {
      mockSend.mockRejectedValue(new Error('SES unavailable'));

      const emailClient = build__EmailClient({
        logger,
        emailConfig: {
          fromEmail: 'sender@example.com',
          fromName: '',
          awsRegion: 'us-east-1',
        },
      });

      const result = await emailClient.sendEmail({
        to: 'recipient@example.com',
        subject: 'Hello',
        html: '<p>Welcome</p>',
        fromEmail: 'sender@example.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ContractError.EmailSendFailed);
      }
    });
  });
});
