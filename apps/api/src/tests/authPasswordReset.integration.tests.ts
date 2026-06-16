import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { ContractError, ok } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type { NotificationService } from '@packages/notifications';
import bcrypt from 'bcryptjs';
import knexFactory from 'knex';
import type { Knex } from 'knex';
import { DateTime } from 'luxon';
import { createHash, randomUUID } from 'node:crypto';

import { createConfigFromEnv } from '../config.js';
import { build__KnexConfig } from '../knexfile.js';
import type { AuthService } from '../services/authService.js';
import { build__AuthService } from '../services/authService.js';

const TEST_USER_EMAILS = [
  'reset-known@example.test',
  'reset-twice@example.test',
  'reset-valid@example.test',
  'reset-invalid@example.test',
  'reset-locked@example.test',
  'reset-expired@example.test',
  'unknown@example.test',
  'missing@example.test',
] as const;

const resetPasswordResetTestData = async (database: Knex): Promise<void> => {
  await database('passwordReset').del();
  await database('user').whereIn('email', [...TEST_USER_EMAILS]).del();
};

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
} satisfies Logger;

const flushPendingNotifications = async (
  notifyMock: jest.Mock<NotificationService['notify']>,
): Promise<void> => {
  await Promise.all(
    notifyMock.mock.results.map(async (result) => {
      await result.value;
    }),
  );
};

describe('AuthService password reset', () => {
  let database: Knex;
  let authService: AuthService;
  let notifyMock: jest.Mock<NotificationService['notify']>;
  let capturedCodes: string[];

  beforeAll(async () => {
    const config = createConfigFromEnv();
    database = knexFactory(build__KnexConfig({ config }));
    const g = globalThis as typeof globalThis & { __photoappTestKnex?: Knex };
    g.__photoappTestKnex = database;
    await resetPasswordResetTestData(database);

    capturedCodes = [];
    notifyMock = jest.fn<NotificationService['notify']>(async (payload) => {
      if (payload.template === 'forgot-password' && payload.data?.code !== undefined) {
        capturedCodes.push(String(payload.data.code));
      }
      return ok({ messageId: 'test-msg' });
    });

    authService = build__AuthService({
      database,
      logger,
      config,
      notificationService: { notify: notifyMock },
    });
  });

  afterEach(async () => {
    await flushPendingNotifications(notifyMock);
    await resetPasswordResetTestData(database);
    capturedCodes.length = 0;
    notifyMock.mockClear();
  });

  const createUserWithPassword = async (
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; password: string }> => {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    await database('user').insert({
      id,
      email,
      firstName: 'Reset',
      lastName: 'Tester',
      passwordHash,
      emailVerified: true,
      smsOptIn: false,
      createdBy: id,
      updatedBy: id,
    });
    return { id, email, password };
  };

  describe('When forgotPassword is called for a known user', () => {
    it('should store a hashed code and send it via email', async () => {
      const { id, email } = await createUserWithPassword(
        'reset-known@example.test',
        'oldPassword1',
      );

      const result = await authService.forgotPassword(email);
      await flushPendingNotifications(notifyMock);

      expect(result.success).toBe(true);
      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: { email },
          channels: ['email'],
          template: 'forgot-password',
        }),
      );

      const code = capturedCodes[0];
      expect(code).toMatch(/^\d{6}$/);

      const resetRow = await database('passwordReset').where({ userId: id }).first<{
        codeHash: string;
        consumedAt?: string;
        attemptCount: number;
      }>();

      expect(resetRow).toBeDefined();
      expect(resetRow?.consumedAt).toBeUndefined();
      expect(resetRow?.attemptCount).toBe(0);
      expect(createHash('sha256').update(code!).digest('hex')).toBe(resetRow?.codeHash);
    });
  });

  describe('When forgotPassword is called for an unknown email', () => {
    it('should return success without sending email', async () => {
      const result = await authService.forgotPassword('unknown@example.test');
      await flushPendingNotifications(notifyMock);

      expect(result.success).toBe(true);
      expect(notifyMock).not.toHaveBeenCalled();
    });
  });

  describe('When forgotPassword is called twice for the same user', () => {
    it('should invalidate the previous code', async () => {
      const { email } = await createUserWithPassword('reset-twice@example.test', 'oldPassword1');

      await authService.forgotPassword(email);
      await flushPendingNotifications(notifyMock);
      const firstCode = capturedCodes[0]!;

      await authService.forgotPassword(email);
      await flushPendingNotifications(notifyMock);
      const secondCode = capturedCodes[1]!;

      expect(firstCode).not.toBe(secondCode);

      const firstAttempt = await authService.resetPassword(email, 'newPassword9', firstCode);
      expect(firstAttempt.success).toBe(false);
      if (!firstAttempt.success) {
        expect(firstAttempt.error.equals(ContractError.InvalidPasswordResetCode)).toBe(true);
      }

      const secondAttempt = await authService.resetPassword(email, 'newPassword9', secondCode);
      expect(secondAttempt.success).toBe(true);
    });
  });

  describe('When resetPassword is called with a valid code', () => {
    it('should update the password and mark the reset as consumed', async () => {
      const { id, email, password } = await createUserWithPassword(
        'reset-valid@example.test',
        'oldPassword1',
      );

      await authService.forgotPassword(email);
      await flushPendingNotifications(notifyMock);
      const code = capturedCodes[0]!;
      const newPassword = 'newPassword9';

      const result = await authService.resetPassword(email, newPassword, code);
      await flushPendingNotifications(notifyMock);

      expect(result.success).toBe(true);

      const user = await database('user').where({ id }).first<{ passwordHash?: string }>();
      expect(await bcrypt.compare(newPassword, user!.passwordHash!)).toBe(true);
      expect(await bcrypt.compare(password, user!.passwordHash!)).toBe(false);

      const resetRow = await database('passwordReset').where({ userId: id }).first<{
        consumedAt?: string;
      }>();
      expect(resetRow?.consumedAt).toBeDefined();

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: { email },
          template: 'password-reset',
        }),
      );
    });
  });

  describe('When resetPassword is called with an invalid code', () => {
    it('should fail and increment the attempt count', async () => {
      const { id, email } = await createUserWithPassword(
        'reset-invalid@example.test',
        'oldPassword1',
      );

      await authService.forgotPassword(email);
      await flushPendingNotifications(notifyMock);

      const result = await authService.resetPassword(email, 'newPassword9', '000000');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.equals(ContractError.InvalidPasswordResetCode)).toBe(true);
      }

      const resetRow = await database('passwordReset').where({ userId: id }).first<{
        attemptCount: number;
      }>();
      expect(resetRow?.attemptCount).toBe(1);
    });
  });

  describe('When resetPassword is called after three failed attempts', () => {
    it('should return TooManyAttempts', async () => {
      const { id, email } = await createUserWithPassword(
        'reset-locked@example.test',
        'oldPassword1',
      );

      await authService.forgotPassword(email);
      await flushPendingNotifications(notifyMock);
      const code = capturedCodes[0]!;

      await database('passwordReset').where({ userId: id }).update({ attemptCount: 3 });

      const result = await authService.resetPassword(email, 'newPassword9', code);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.equals(ContractError.TooManyAttempts)).toBe(true);
      }
    });
  });

  describe('When resetPassword is called after the code has expired', () => {
    it('should return InvalidPasswordResetCode', async () => {
      const { id, email } = await createUserWithPassword(
        'reset-expired@example.test',
        'oldPassword1',
      );

      await authService.forgotPassword(email);
      await flushPendingNotifications(notifyMock);
      const code = capturedCodes[0]!;

      await database('passwordReset')
        .where({ userId: id })
        .update({ expiresAt: DateTime.now().minus({ minutes: 1 }).toISO() });

      const result = await authService.resetPassword(email, 'newPassword9', code);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.equals(ContractError.InvalidPasswordResetCode)).toBe(true);
      }
    });
  });

  describe('When resetPassword is called for an unknown email', () => {
    it('should return InvalidPasswordResetCode', async () => {
      const result = await authService.resetPassword('missing@example.test', 'newPassword9', '123456');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.equals(ContractError.InvalidPasswordResetCode)).toBe(true);
      }
    });
  });
});
