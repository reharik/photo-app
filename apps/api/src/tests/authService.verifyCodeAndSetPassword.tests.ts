/**
 * RAI-76: Unit coverage for AuthService.verifyCodeAndSetPassword focused on the
 * bits the integration test can't cleanly observe: the exact ORDER of
 * consume→commit→notify, that a pre-commit throw rolls back, and that the
 * `committed` flag stops a post-commit notify failure from rolling back an
 * already-committed user. DB effects (counter-persists, atomic consume) live in
 * authPasswordReset.integration.tests.ts.
 *
 * Oracle: E1 no row → reject+rollback; E2 locked → reject+rollback (no bump);
 * E3 bad code → reject+rollback + attempt bump; E4 activate fails → rollback;
 * E6 success → save+consume then commit then notify (in that order).
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContractError, fail, ok } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type {
  EmailVerificationRepository,
  SystemEmailVerificationRepository,
  UnitOfWork,
  UserRepository,
} from '@packages/media-core';
import type { NotificationService } from '@packages/notifications';
import { createHash } from 'node:crypto';

import type { Config } from '../config.js';
import { build__AuthService } from '../services/authService.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
} satisfies Logger;

const config = {
  jwtSecret: 'test-secret',
  jwtExpiresIn: '1h',
  clientUrl: 'http://localhost:5173',
} as unknown as Config;

const VALID_ID = 'verification-1';

type Harness = {
  order: string[];
  uow: jest.Mocked<Pick<UnitOfWork, 'commit' | 'rollback'>>;
  notify: jest.Mock<NotificationService['notify']>;
  save: jest.Mock<UserRepository['save']>;
  getUserByEmail: jest.Mock<UserRepository['getUserByEmail']>;
  getValidVerification: jest.Mock<EmailVerificationRepository['getValidVerification']>;
  completeConsumption: jest.Mock<EmailVerificationRepository['completeConsumption']>;
  bumpValidationAttempts: jest.Mock<SystemEmailVerificationRepository['bumpValidationAttempts']>;
  service: ReturnType<typeof build__AuthService>;
};

const codeHashFor = (code: string): string =>
  // must match the service's own hashing (sha256 hex)
  createHash('sha256').update(code).digest('hex');

const makeHarness = (): Harness => {
  const order: string[] = [];

  const uow = {
    commit: jest.fn(async () => {
      order.push('commit');
    }),
    rollback: jest.fn(async () => {
      order.push('rollback');
    }),
  } as unknown as jest.Mocked<Pick<UnitOfWork, 'commit' | 'rollback'>>;

  const notify = jest.fn<NotificationService['notify']>(async () => {
    order.push('notify');
    return ok('notif-id');
  });

  const save = jest.fn<UserRepository['save']>(async () => {
    order.push('save');
  });
  const getUserByEmail = jest.fn<UserRepository['getUserByEmail']>(async () => undefined);
  const getValidVerification = jest.fn<EmailVerificationRepository['getValidVerification']>();
  const completeConsumption = jest.fn<EmailVerificationRepository['completeConsumption']>(
    async () => {
      order.push('consume');
    },
  );
  const bumpValidationAttempts = jest.fn<SystemEmailVerificationRepository['bumpValidationAttempts']>(
    async () => {
      order.push('bump');
      return 1;
    },
  );

  const service = build__AuthService({
    logger,
    config,
    notificationService: { notify } as unknown as NotificationService,
    userRepository: { getUserByEmail, save } as unknown as UserRepository,
    emailVerificationRepository: {
      getValidVerification,
      completeConsumption,
    } as unknown as EmailVerificationRepository,
    systemEmailVerificationRepository: {
      bumpValidationAttempts,
    } as unknown as SystemEmailVerificationRepository,
    uow: uow as unknown as UnitOfWork,
  });

  return {
    order,
    uow,
    notify,
    save,
    getUserByEmail,
    getValidVerification,
    completeConsumption,
    bumpValidationAttempts,
    service,
  };
};

const creds = (overrides: Record<string, unknown> = {}) => ({
  email: 'unit@example.test',
  password: 'newPassword9',
  code: 'GOODCODE',
  firstName: 'Given',
  lastName: 'Family',
  smsOptIn: false,
  ...overrides,
});

const validRow = (overrides: Record<string, unknown> = {}) => ({
  id: VALID_ID,
  email: 'unit@example.test',
  codeHash: codeHashFor('GOODCODE'),
  expiresAt: new Date(Date.now() + 600_000).toISOString(),
  consumedAt: null,
  attemptCount: 0,
  ...overrides,
});

describe('AuthService.verifyCodeAndSetPassword (unit)', () => {
  let h: Harness;
  beforeEach(() => {
    h = makeHarness();
  });

  describe('E1 — no verification row', () => {
    it('rejects with InvalidEmailVerificationCode and rolls back without saving', async () => {
      h.getValidVerification.mockResolvedValue(undefined as never);

      const result = await h.service.verifyCodeAndSetPassword(creds());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.equals(ContractError.InvalidEmailVerificationCode)).toBe(true);
      }
      expect(h.uow.rollback).toHaveBeenCalledTimes(1);
      expect(h.uow.commit).not.toHaveBeenCalled();
      expect(h.save).not.toHaveBeenCalled();
      expect(h.bumpValidationAttempts).not.toHaveBeenCalled();
    });
  });

  describe('E2 — attemptCount >= 3', () => {
    it('rejects with TooManyAttempts, rolls back, and does NOT bump the counter', async () => {
      h.getValidVerification.mockResolvedValue(validRow({ attemptCount: 3 }) as never);

      const result = await h.service.verifyCodeAndSetPassword(creds());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.equals(ContractError.TooManyAttempts)).toBe(true);
      }
      expect(h.bumpValidationAttempts).not.toHaveBeenCalled();
      expect(h.uow.rollback).toHaveBeenCalledTimes(1);
      expect(h.uow.commit).not.toHaveBeenCalled();
      expect(h.save).not.toHaveBeenCalled();
    });
  });

  describe('E3 — bad code', () => {
    it('bumps the attempt counter (out-of-band) BEFORE rolling back, and rejects', async () => {
      h.getValidVerification.mockResolvedValue(validRow() as never);

      const result = await h.service.verifyCodeAndSetPassword(creds({ code: 'WRONG' }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.equals(ContractError.InvalidEmailVerificationCode)).toBe(true);
      }
      expect(h.bumpValidationAttempts).toHaveBeenCalledWith(VALID_ID);
      // bump is awaited before the rollback so it is durable regardless of the trx.
      expect(h.order).toEqual(['bump', 'rollback']);
      expect(h.uow.commit).not.toHaveBeenCalled();
      expect(h.save).not.toHaveBeenCalled();
    });
  });

  describe('E4 — pending user activate() fails', () => {
    it('rolls back with ErrorActivatingUser and never saves or consumes', async () => {
      h.getValidVerification.mockResolvedValue(validRow() as never);
      const pendingUser = {
        kind: 'pending' as const,
        id: () => 'pending-user-1',
        activate: jest.fn(() => fail(ContractError.InvalidPhoneNumber)),
      };
      h.getUserByEmail.mockResolvedValue(pendingUser as never);

      const result = await h.service.verifyCodeAndSetPassword(creds({ phone: '123' }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.equals(ContractError.ErrorActivatingUser)).toBe(true);
      }
      expect(h.uow.rollback).toHaveBeenCalledTimes(1);
      expect(h.uow.commit).not.toHaveBeenCalled();
      expect(h.save).not.toHaveBeenCalled();
      expect(h.completeConsumption).not.toHaveBeenCalled();
    });
  });

  describe('E6 — success (new user)', () => {
    it('saves + consumes, then commits, then notifies — in that order', async () => {
      h.getValidVerification.mockResolvedValue(validRow() as never);

      const result = await h.service.verifyCodeAndSetPassword(creds());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.value.token).toBe('string');
      }
      // Ordering oracle: write + consume happen inside the uow, THEN commit, THEN notify.
      expect(h.order).toEqual(['save', 'consume', 'commit', 'notify']);
      expect(h.uow.rollback).not.toHaveBeenCalled();
      expect(h.notify).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'welcome', channels: ['email'] }),
      );
    });

    it('a notify RESULT failure still returns ok and does not roll back', async () => {
      h.getValidVerification.mockResolvedValue(validRow() as never);
      h.notify.mockResolvedValue(fail(ContractError.noRecipientsProvided));

      const result = await h.service.verifyCodeAndSetPassword(creds());

      expect(result.success).toBe(true);
      expect(h.uow.commit).toHaveBeenCalledTimes(1);
      expect(h.uow.rollback).not.toHaveBeenCalled();
    });

    it('a notify REJECTION propagates but does NOT roll back the committed uow', async () => {
      h.getValidVerification.mockResolvedValue(validRow() as never);
      h.notify.mockImplementation(async () => {
        throw new Error('SES exploded');
      });

      await expect(h.service.verifyCodeAndSetPassword(creds())).rejects.toThrow('SES exploded');
      // committed flag guards the catch: commit ran, rollback must NOT.
      expect(h.uow.commit).toHaveBeenCalledTimes(1);
      expect(h.uow.rollback).not.toHaveBeenCalled();
    });
  });

  describe('pre-commit throw', () => {
    it('rolls back and rethrows when a write throws before commit', async () => {
      h.getValidVerification.mockResolvedValue(validRow() as never);
      h.save.mockImplementation(async () => {
        throw new Error('db write failed');
      });

      await expect(h.service.verifyCodeAndSetPassword(creds())).rejects.toThrow('db write failed');
      expect(h.uow.rollback).toHaveBeenCalledTimes(1);
      expect(h.uow.commit).not.toHaveBeenCalled();
    });
  });
});
