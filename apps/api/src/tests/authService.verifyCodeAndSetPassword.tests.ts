/**
 * RAI-76: Unit coverage for AuthService.verifyCodeAndSetPassword.
 *
 * What this suite is about CHANGED with the worker-core split, because the
 * service's surface shrank. It used to own a `uow`, commit itself on the success
 * path, mint the JWT and send the email; the whole point of the old oracle was the
 * consume→commit→notify ordering. All four of those moved up into
 * `AuthController`. The service now takes no `uow`, no `config` and no
 * `notificationService`: it does its writes through injected repositories and
 * reports the outcome as data.
 *
 * So the boundary assertions are gone from here rather than restated. There is no
 * `uow` to fake, and asserting on the caller's commit from inside the callee's
 * test would be worse than asserting nothing. They live where the behaviour now
 * lives:
 *  - `authController.tests.ts` — that the commit precedes the JWT mint and the
 *    send, and that a fail-as-data result triggers `flagRollbackOnly`.
 *  - `authSetPassword.integration.tests.ts` — the same, end to end against real
 *    Postgres, including E3's bump surviving the rollback.
 *
 * Structurally the service can no longer complete a transaction even by accident:
 * with no `uow` dependency there is no code path on which it could, which is why
 * the old "the service only ever completes ONE way" caveat is no longer needed.
 *
 * What remains here is the service's own contract, which the integration test
 * cannot observe as precisely: WHICH error each rejection carries, WHICH writes
 * happen and in what order, that the bad-code attempt bump is routed out-of-band
 * through `systemEmailVerificationRepository` rather than the request's own
 * handle, and that a failure short-circuits before the consume.
 *
 * Oracle: E1 no row → reject, nothing written; E2 locked → same, and NO bump;
 * E3 bad code → bump and nothing else; E4 activate fails → reject before consume;
 * E6 success → activate/save THEN consume, reporting the template the controller
 * emails on.
 */
import assert from 'node:assert';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContractError, fail, type OperationResult } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type {
  EmailVerificationRepository,
  PendingUser,
  SystemEmailVerificationRepository,
  User,
  UserRepository,
} from '@packages/media-core';
import { createHash } from 'node:crypto';

import { build__AuthService } from '../services/authService.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
} satisfies Logger;

const VALID_ID = 'verification-1';

type ActivateInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  passwordHash: string;
};

type Harness = {
  /** Every repository write the service made, in the order it made them. */
  order: string[];
  save: jest.Mock<UserRepository['save']>;
  getUserByEmail: jest.Mock<UserRepository['getUserByEmail']>;
  getValidVerification: jest.Mock<EmailVerificationRepository['getValidVerification']>;
  completeConsumption: jest.Mock<EmailVerificationRepository['completeConsumption']>;
  bumpValidationAttempts: jest.Mock<SystemEmailVerificationRepository['bumpValidationAttempts']>;
  activatePendingUser: jest.Mock<
    (input: ActivateInput, user: PendingUser, actorId: string) => Promise<OperationResult<void>>
  >;
  service: ReturnType<typeof build__AuthService>;
};

const codeHashFor = (code: string): string =>
  // must match the service's own hashing (sha256 hex)
  createHash('sha256').update(code).digest('hex');

const makeHarness = (): Harness => {
  const order: string[] = [];

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
  // The system repository is the out-of-band one: it holds a raw autocommit handle
  // rather than the request's transaction. Recording it under its own name is how
  // these cases distinguish "bumped durably" from "bumped inside the doomed
  // transaction" without a uow to inspect.
  const bumpValidationAttempts = jest.fn<
    SystemEmailVerificationRepository['bumpValidationAttempts']
  >(async () => {
    order.push('bump');
    return 1;
  });

  // Stands in for the real write service, which activates the user, SAVES them, and then
  // re-materializes their album authorizations. Activate-then-save mirrors that contract —
  // authService no longer saves the pending user itself — so the ordering oracle still sees
  // 'save' and a save throw still surfaces. Delegating to user.activate() keeps every
  // oracle below pointed at the domain result (E4 mocks activate() to fail) while leaving
  // the album work — which needs an AlbumRepository — out of this unit test.
  const activatePendingUser = jest.fn(
    async (input: ActivateInput, user: PendingUser, actorId: string) => {
      const result = user.activate(input as Parameters<PendingUser['activate']>[0], actorId);
      if (!result.success) {
        return result;
      }
      await save(user);
      return result;
    },
  );

  const service = build__AuthService({
    scopedLogger: logger,
    activatePendingUserWriteService: activatePendingUser,
    userRepository: {
      getUserByEmail,
      save,
      // Unused by this write path; present so the fake satisfies UserRepository outright.
      getById: jest.fn<UserRepository['getById']>(),
      getByHandle: jest.fn<UserRepository['getByHandle']>(),
      getAllUsersByEmail: jest.fn<UserRepository['getAllUsersByEmail']>(),
    },
    emailVerificationRepository: {
      getValidVerification,
      completeConsumption,
    },
    systemEmailVerificationRepository: {
      bumpValidationAttempts,
    },
  });

  return {
    order,
    save,
    getUserByEmail,
    getValidVerification,
    completeConsumption,
    bumpValidationAttempts,
    activatePendingUser,
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
    it('rejects with InvalidEmailVerificationCode and writes nothing at all', async () => {
      h.getValidVerification.mockResolvedValue(undefined as never);

      const result = await h.service.verifyCodeAndSetPassword(creds());

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.InvalidEmailVerificationCode)).toBe(true);
      expect(h.order).toEqual([]);
      expect(h.bumpValidationAttempts).not.toHaveBeenCalled();
    });
  });

  describe('E2 — attemptCount >= 3', () => {
    it('rejects with TooManyAttempts and does NOT bump the counter', async () => {
      h.getValidVerification.mockResolvedValue(validRow({ attemptCount: 3 }));

      const result = await h.service.verifyCodeAndSetPassword(creds());

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.TooManyAttempts)).toBe(true);
      // The lockout check precedes the bad-code branch, so a locked-out caller cannot
      // keep inflating their own counter by guessing.
      expect(h.bumpValidationAttempts).not.toHaveBeenCalled();
      expect(h.order).toEqual([]);
    });
  });

  describe('E3 — bad code', () => {
    it('bumps the attempt counter out-of-band and rejects without touching the user', async () => {
      h.getValidVerification.mockResolvedValue(validRow());

      const result = await h.service.verifyCodeAndSetPassword(creds({ code: 'WRONG' }));

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.InvalidEmailVerificationCode)).toBe(true);
      // Routed through systemEmailVerificationRepository, which rides its own
      // autocommit connection rather than the caller's transaction — that is what
      // makes the increment survive the rollback the controller is about to flag, and
      // without it the >= 3 lockout in E2 could never trigger. The surviving-a-real-
      // rollback half of that claim is pinned in authSetPassword.integration.tests.ts.
      expect(h.bumpValidationAttempts).toHaveBeenCalledWith(VALID_ID);
      expect(h.order).toEqual(['bump']);
    });
  });

  describe('E4 — pending user activate() fails', () => {
    it('propagates the domain error and never saves or consumes', async () => {
      h.getValidVerification.mockResolvedValue(validRow());
      const pendingUser = {
        kind: 'pending' as const,
        id: () => 'pending-user-1',
        activate: jest.fn(() => fail(ContractError.InvalidPhoneNumber)),
      };
      h.getUserByEmail.mockResolvedValue(pendingUser as never);

      const result = await h.service.verifyCodeAndSetPassword(creds({ phone: '123' }));

      expect(result.success).toBe(false);
      assert(!result.success);
      // The SPECIFIC failure, not a generic ErrorActivatingUser: the forgot-password
      // door lands a brand-new email here with no name, and the FE reveals the name
      // fields off this exact reason.
      expect(result.error.equals(ContractError.InvalidPhoneNumber)).toBe(true);
      expect(h.order).toEqual([]);
      // Short-circuits BEFORE the consume, so the emailed code is still redeemable
      // once the user corrects their input.
      expect(h.completeConsumption).not.toHaveBeenCalled();
    });
  });

  describe('E6 — success (new user)', () => {
    it('activates and saves the user, THEN consumes the code, reporting welcome', async () => {
      h.getValidVerification.mockResolvedValue(validRow());

      const result = await h.service.verifyCodeAndSetPassword(creds());

      expect(result.success).toBe(true);
      assert(result.success);
      expect(result.value.template).toBe('welcome');
      expect(typeof result.value.userId).toBe('string');
      // Save before consume: the consume is what makes the code unusable, so it must
      // be the last thing to happen. Both land in the caller's one transaction, so a
      // failure between them takes the whole thing down.
      expect(h.order).toEqual(['save', 'consume']);
      expect(h.completeConsumption).toHaveBeenCalledWith(VALID_ID);
      // The userId is the activated user's, which is what the controller signs into
      // the session cookie.
      expect(h.activatePendingUser).toHaveBeenCalledTimes(1);
    });

    it('hands the write service a bcrypt hash, never the plaintext password', async () => {
      h.getValidVerification.mockResolvedValue(validRow());

      await h.service.verifyCodeAndSetPassword(creds());

      const [input] = h.activatePendingUser.mock.calls[0];
      expect(input.passwordHash).not.toBe('newPassword9');
      expect(input.passwordHash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('E6 — success (existing active user → password reset)', () => {
    it('sets the new hash and saves, THEN consumes, reporting passwordChanged', async () => {
      h.getValidVerification.mockResolvedValue(validRow());
      const setPassword = jest.fn();
      const activeUser = {
        kind: 'active' as const,
        id: () => 'active-user-1',
        setPassword,
      };
      h.getUserByEmail.mockResolvedValue(activeUser as unknown as User);

      const result = await h.service.verifyCodeAndSetPassword(creds());

      expect(result.success).toBe(true);
      assert(result.success);
      // A different template than the new-user branch — this is the only signal the
      // controller has for which email to send.
      expect(result.value.template).toBe('passwordChanged');
      expect(result.value.userId).toBe('active-user-1');
      expect(h.order).toEqual(['save', 'consume']);
      // The reset path does NOT go through the activate write service — there is no
      // pending user and no authorization to re-materialize.
      expect(h.activatePendingUser).not.toHaveBeenCalled();
      const [hash, actorId] = setPassword.mock.calls[0] as [string, string];
      expect(hash).toMatch(/^\$2[aby]\$/);
      // Self-service off an emailed code: the user is their own actor.
      expect(actorId).toBe('active-user-1');
    });
  });

  describe('a throwing write', () => {
    it('propagates unchanged, leaving the code unconsumed', async () => {
      h.getValidVerification.mockResolvedValue(validRow());
      h.save.mockImplementation(async () => {
        throw new Error('db write failed');
      });

      await expect(h.service.verifyCodeAndSetPassword(creds())).rejects.toThrow('db write failed');
      // The service does not catch and does not translate: the caller's
      // `uow.inTransaction` is what rolls the partial write back, and it can only do
      // that if the throw reaches it.
      expect(h.completeConsumption).not.toHaveBeenCalled();
    });
  });
});
