import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { ContractError, fail, ok } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type { EmailChannel } from '../channels/email.js';
import type { SmsChannel } from '../channels/sms.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
} satisfies Logger;

describe('build__NotificationService', () => {
  let build__NotificationService: typeof import('../notificationService.js').build__NotificationService;

  beforeAll(async () => {
    jest.unstable_mockModule('../templates/index.js', () => ({
      templateRegistry: {
        welcome: {
          Component: () => null,
          getSubject: () => 'Welcome, Jane Doe',
        },
        shareInvite: {
          Component: () => null,
          getSubject: () => 'You have been invited',
        },
        digest: {
          Component: () => null,
          getSubject: () => 'Your weekly recap',
        },
      },
    }));

    // '@react-email/components' is statically mocked via moduleNameMapper (its `render`
    // serializes props, so the html still contains the recipient's name).
    ({ build__NotificationService } = await import('../notificationService.js'));
  });

  describe('When sending a welcome email', () => {
    it('should render the template and return the provider message id', async () => {
      const sendEmail = jest
        .fn<EmailChannel['sendEmail']>()
        .mockResolvedValue(ok({ messageId: 'welcome-msg-1' }));

      const emailChannel: EmailChannel = { sendEmail };
      const sendSms = jest.fn<SmsChannel['sendSms']>();
      const smsChannel: SmsChannel = { sendSms };

      const service = build__NotificationService({
        logger,
        channels: { emailChannel, smsChannel },
      });

      const result = await service.notify({
        to: 'jane@example.com',
        template: 'welcome',
        data: {
          firstName: 'Jane',
          lastName: 'Doe',
          appUrl: 'https://photos.example.com',
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // notify joins per-channel message ids; a single email send yields just its id.
        expect(result.value).toBe('welcome-msg-1');
      }

      expect(sendEmail).toHaveBeenCalledTimes(1);
      const [payload] = sendEmail.mock.calls[0] ?? [];
      expect(payload?.to).toBe('jane@example.com');
      expect(payload?.subject).toContain('Jane');
      expect(payload?.html).toContain('Jane');
    });
  });

  describe('When the email channel fails', () => {
    it('should return a failure result with the contract error message', async () => {
      const sendEmail = jest
        .fn<EmailChannel['sendEmail']>()
        .mockResolvedValue(fail(ContractError.EmailSendFailed));

      const service = build__NotificationService({
        logger,
        channels: {
          emailChannel: { sendEmail },
          smsChannel: { sendSms: jest.fn<SmsChannel['sendSms']>() },
        },
      });

      const result = await service.notify({
        to: 'jane@example.com',
        template: 'welcome',
        data: {
          firstName: 'Jane',
          lastName: 'Doe',
          appUrl: 'https://photos.example.com',
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // notify surfaces the ContractError itself (not its display string).
        expect(result.error).toBe(ContractError.EmailSendFailed);
      }
    });
  });
});
