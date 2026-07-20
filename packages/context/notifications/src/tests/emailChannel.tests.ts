import assert from 'node:assert';

import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { ContractError, ok } from '@packages/contracts';
import type { EmailService } from '../emailClient.js';

describe('build__EmailChannel', () => {
  let build__EmailChannel: typeof import('../channels/email.js').build__EmailChannel;

  beforeAll(async () => {
    ({ build__EmailChannel } = await import('../channels/email.js'));
  });

  describe('When FROM_EMAIL is not configured', () => {
    it('should return EmailNotConfigured', async () => {
      const sendEmail = jest.fn<EmailService['sendEmail']>();
      const emailClient: EmailService = { sendEmail };

      const channel = build__EmailChannel({
        config: {
          fromEmail: '',
          fromName: 'Homeroll',
          awsRegion: 'us-east-1',
        },
        emailClient,
      });

      const result = await channel.sendEmail({
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error).toBe(ContractError.EmailNotConfigured);
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('When FROM_EMAIL is configured', () => {
    it('should delegate to the email client with sender details', async () => {
      const sendEmail = jest
        .fn<EmailService['sendEmail']>()
        .mockResolvedValue(ok({ messageId: 'msg-456' }));

      const channel = build__EmailChannel({
        config: {
          fromEmail: 'notifications@example.com',
          fromName: 'Homeroll',
          awsRegion: 'us-east-1',
        },
        emailClient: { sendEmail },
      });

      const result = await channel.sendEmail({
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<p>Hello</p>',
        text: 'Hello',
      });

      expect(sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<p>Hello</p>',
        fromEmail: 'notifications@example.com',
        fromDisplayName: 'Homeroll',
        text: 'Hello',
      });
      expect(result.success).toBe(true);
      assert(result.success);
      expect(result.value.messageId).toBe('msg-456');
    });
  });
});
