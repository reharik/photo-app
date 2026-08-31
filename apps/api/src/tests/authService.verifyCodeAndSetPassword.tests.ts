/**
 * RAI-76: Unit coverage for AuthService.verifyCodeAndSetPassword focused on the
 * bits the integration test can't cleanly observe: the exact ORDER of
 * consume→commit→notify, that a pre-commit throw rolls back, and that the
 * `committed` flag stops a post-commit notify failure from rolling back an
 * already-committed user. DB effects (counter-persists, atomic consume) live in
 * authPasswordReset.integration.tests.ts.
 *
 * Settlement surface: the service only ever settles ONE way — `complete(true)` on
 * the success path, because notifyUser has to run post-commit. Every failure and
 * throw path returns without settling, and the request boundary rolls the uow back
 * in its `finally` via `settle(false)`. `throughBoundary` below reproduces exactly
 * that bracket (see authController.setPassword), so each oracle can still say WHICH
 * path ends committed and which ends rolled back.
 *
 * The fake models the one behaviour that makes the bracket safe: `settle` is inert
 * once the transaction is gone, so the boundary's unconditional `settle(false)`
 * cannot undo a commit the service already made.
 *
 * Oracle: E1 no row → reject, boundary rolls back; E2 locked → same (no bump);
 * E3 bad code → attempt bump BEFORE the rollback; E4 activate fails → rolls back;
 * E6 success → save+consume then commit then notify (in that order), with the
 * boundary's settle a no-op on top of it.
 */
import assert from 'node:assert';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContractError, fail, ok, type OperationResult } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type {
  EmailVerificationRepository,
  PendingUser,
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
  complete: jest.Mock<UnitOfWork['complete']>;
  settle: jest.Mock<UnitOfWork['settle']>;
  /** The `ok` argument of every `complete(ok)` call, in order. */
  completions: () => boolean[];
  /** The `ok` argument of every `settle(ok)` call the boundary made, in order. */
  settlements: () => boolean[];
  /** Runs the service inside the request boundary's try/finally, as the controller does. */
  throughBoundary: <T>(run: () => Promise<T>) => Promise<T>;
  notify: jest.Mock<NotificationService['notify']>;
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

type ActivateInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  passwordHash: string;
};

const codeHashFor = (code: string): string =>
  // must match the service's own hashing (sha256 hex)
  createHash('sha256').update(code).digest('hex');

const makeHarness = (): Harness => {
  const order: string[] = [];

  // A transaction is open from the outset: the first thing this path does is read the
  // verification row, and every repository joins the uow before it queries. Tracking
  // `open` is what lets the fake reproduce the property the boundary depends on —
  // `settle` does nothing once the transaction has already been completed — so the
  // ordering oracle keeps its original vocabulary (`commit` / `rollback`) either way.
  let open = true;
  const complete = jest.fn<UnitOfWork['complete']>(async (ok: boolean) => {
    if (!open) {
      throw new Error('Transaction not started');
    }
    open = false;
    order.push(ok ? 'commit' : 'rollback');
  });
  const settle = jest.fn<UnitOfWork['settle']>(async (ok: boolean) => {
    if (!open) {
      return;
    }
    open = false;
    order.push(ok ? 'commit' : 'rollback');
  });
  const uow: UnitOfWork = {
    id: 'unit-test-uow',
    beginIsolatedOnly: async () => {},
    join: async () => {
      open = true;
    },
    // The service under test never touches the transaction handle directly — it goes
    // through the repositories, which are faked. Matching the real contract (db()
    // throws until a transaction is open) keeps an accidental use loud rather than
    // silently undefined.
    db: () => {
      throw new Error('db() is not available in this unit test');
    },
    complete,
    settle,
    collectEvents: () => {},
    flagRollbackOnly: () => {},
  };

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
  const bumpValidationAttempts = jest.fn<
    SystemEmailVerificationRepository['bumpValidationAttempts']
  >(async () => {
    order.push('bump');
    return 1;
  });

  // Stands in for the real write service, which activates the user, SAVES them, and then
  // re-materializes their album authorizations. Activate-then-save mirrors that contract —
  // authService no longer saves the pending user itself — so the ordering oracle still sees
  // 'save' and a save throw still surfaces pre-commit. Delegating to user.activate() keeps
  // every oracle below pointed at the domain result (E4 mocks activate() to fail) while
  // leaving the album work — which needs an AlbumRepository — out of a unit test about uow
  // ordering.
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
    logger,
    config,
    notificationService: { notify },
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
    uow,
  });

  return {
    order,
    complete,
    settle,
    completions: () => complete.mock.calls.map(([ok]) => ok),
    settlements: () => settle.mock.calls.map(([ok]) => ok),
    // Mirrors authController.setPassword: the service commits on success and returns
    // (or throws) without settling on every other path, so the boundary's finally is
    // what actually rolls the request back.
    throughBoundary: async (run) => {
      try {
        return await run();
      } finally {
        await service.settle(false);
      }
    },
    notify,
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
    it('rejects with InvalidEmailVerificationCode and rolls back without saving', async () => {
      h.getValidVerification.mockResolvedValue(undefined as never);

      const result = await h.throughBoundary(() => h.service.verifyCodeAndSetPassword(creds()));

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.InvalidEmailVerificationCode)).toBe(true);
      // Settled exactly once, as a rollback — and by the boundary, not the service.
      expect(h.completions()).toEqual([]);
      expect(h.settlements()).toEqual([false]);
      expect(h.order).toEqual(['rollback']);
      expect(h.save).not.toHaveBeenCalled();
      expect(h.bumpValidationAttempts).not.toHaveBeenCalled();
    });
  });

  describe('E2 — attemptCount >= 3', () => {
    it('rejects with TooManyAttempts, rolls back, and does NOT bump the counter', async () => {
      h.getValidVerification.mockResolvedValue(validRow({ attemptCount: 3 }));

      const result = await h.throughBoundary(() => h.service.verifyCodeAndSetPassword(creds()));

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.TooManyAttempts)).toBe(true);
      expect(h.bumpValidationAttempts).not.toHaveBeenCalled();
      expect(h.completions()).toEqual([]);
      expect(h.settlements()).toEqual([false]);
      expect(h.save).not.toHaveBeenCalled();
    });
  });

  describe('E3 — bad code', () => {
    it('bumps the attempt counter (out-of-band) BEFORE rolling back, and rejects', async () => {
      h.getValidVerification.mockResolvedValue(validRow());

      const result = await h.throughBoundary(() =>
        h.service.verifyCodeAndSetPassword(creds({ code: 'WRONG' })),
      );

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.InvalidEmailVerificationCode)).toBe(true);
      expect(h.bumpValidationAttempts).toHaveBeenCalledWith(VALID_ID);
      // bump is awaited before the rollback so it is durable regardless of the trx —
      // it rides its own autocommit connection, which is the whole point of routing
      // it through systemEmailVerificationRepository instead of uow.db().
      expect(h.order).toEqual(['bump', 'rollback']);
      expect(h.settlements()).toEqual([false]);
      expect(h.save).not.toHaveBeenCalled();
    });
  });

  describe('E4 — pending user activate() fails', () => {
    it('rolls back with ErrorActivatingUser and never saves or consumes', async () => {
      h.getValidVerification.mockResolvedValue(validRow());
      const pendingUser = {
        kind: 'pending' as const,
        id: () => 'pending-user-1',
        activate: jest.fn(() => fail(ContractError.InvalidPhoneNumber)),
      };
      h.getUserByEmail.mockResolvedValue(pendingUser as never);

      const result = await h.throughBoundary(() =>
        h.service.verifyCodeAndSetPassword(creds({ phone: '123' })),
      );

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.InvalidPhoneNumber)).toBe(true);
      expect(h.completions()).toEqual([]);
      expect(h.settlements()).toEqual([false]);
      expect(h.save).not.toHaveBeenCalled();
      expect(h.completeConsumption).not.toHaveBeenCalled();
    });
  });

  describe('E6 — success (new user)', () => {
    it('saves + consumes, then commits, then notifies — in that order', async () => {
      h.getValidVerification.mockResolvedValue(validRow());

      const result = await h.throughBoundary(() => h.service.verifyCodeAndSetPassword(creds()));

      expect(result.success).toBe(true);
      assert(result.success);
      expect(typeof result.value.token).toBe('string');
      // Ordering oracle: write + consume happen inside the uow, THEN commit, THEN
      // notify. The boundary's settle(false) lands after all of it and adds nothing —
      // if it were not inert, this array would end in a fourth 'rollback'.
      expect(h.order).toEqual(['save', 'consume', 'commit', 'notify']);
      expect(h.completions()).toEqual([true]);
      expect(h.notify).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'welcome', channels: ['email'] }),
      );
    });

    it('a notify RESULT failure still returns ok and does not roll back', async () => {
      h.getValidVerification.mockResolvedValue(validRow());
      h.notify.mockResolvedValue(fail(ContractError.noRecipientsProvided));

      const result = await h.throughBoundary(() => h.service.verifyCodeAndSetPassword(creds()));

      expect(result.success).toBe(true);
      expect(h.completions()).toEqual([true]);
      expect(h.settlements()).toEqual([false]);
    });

    it('a notify REJECTION propagates but does NOT roll back the committed uow', async () => {
      h.getValidVerification.mockResolvedValue(validRow());
      h.notify.mockImplementation(async () => {
        throw new Error('SES exploded');
      });

      await expect(
        h.throughBoundary(() => h.service.verifyCodeAndSetPassword(creds())),
      ).rejects.toThrow('SES exploded');
      // The throw happens POST-commit, and the boundary's settle cannot take that
      // commit back: the single settlement stays the commit. A `complete(false)` in
      // the finally instead of `settle(false)` would have thrown over the real error.
      expect(h.completions()).toEqual([true]);
      expect(h.order).toEqual(['save', 'consume', 'commit']);
    });
  });

  describe('pre-commit throw', () => {
    it('rolls back and rethrows when a write throws before commit', async () => {
      h.getValidVerification.mockResolvedValue(validRow());
      h.save.mockImplementation(async () => {
        throw new Error('db write failed');
      });

      await expect(
        h.throughBoundary(() => h.service.verifyCodeAndSetPassword(creds())),
      ).rejects.toThrow('db write failed');
      // Nothing was committed and the boundary rolled the partial write back.
      expect(h.completions()).toEqual([]);
      expect(h.settlements()).toEqual([false]);
      expect(h.order).toEqual(['rollback']);
    });
  });
});
