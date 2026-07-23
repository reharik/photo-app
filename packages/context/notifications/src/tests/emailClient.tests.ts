import assert from 'node:assert';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContractError } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';

import { build__EmailClient } from '../emailClient.js';
// @aws-sdk/client-ses is statically mocked via moduleNameMapper (see jest.config.js);
// this is that same mock module, so setting its send here controls the client.
// eslint-disable-next-line jest/no-mocks-import -- the control helpers (__setSesSend/__resetSesSend) exist only in this mapped mock module; the real @aws-sdk path can't expose them.
import { __resetSesSend, __setSesSend } from './__mocks__/awsSdkClientSes.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
} satisfies Logger;

describe('build__EmailClient', () => {
  beforeEach(() => {
    __resetSesSend();
  });

  describe('When SES accepts the message', () => {
    it('should return the provider message id', async () => {
      const send = jest.fn(async () => ({ MessageId: 'msg-123' }));
      __setSesSend(send);

      const emailClient = build__EmailClient({
        logger,
        config: {
          fromEmail: 'sender@example.com',
          fromName: 'Homeroll',
          awsRegion: 'us-east-1',
          awsEndpoint: 'http://localhost:4566',
        },
      });

      const result = await emailClient.sendEmail({
        to: 'recipient@example.com',
        subject: 'Hello',
        html: '<p>Welcome</p>',
        fromEmail: 'sender@example.com',
        fromDisplayName: 'Homeroll',
      });

      expect(result.success).toBe(true);
      assert(result.success);
      expect(result.value.messageId).toBe('msg-123');
      expect(send).toHaveBeenCalledTimes(1);
    });
  });

  describe('When SES rejects the message', () => {
    it('should return EmailSendFailed', async () => {
      __setSesSend(async () => {
        throw new Error('SES unavailable');
      });

      const emailClient = build__EmailClient({
        logger,
        config: {
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
      assert(!result.success);
      expect(result.error).toBe(ContractError.EmailSendFailed);
    });
  });
});
