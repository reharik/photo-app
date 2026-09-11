/**
 * The commit/reset fix, and why it is a `finally`.
 *
 * `completeTransaction` used to call `reset()` on the rollback branch only. A
 * successful commit therefore left `trx` truthy and pointing at a COMMITTED
 * transaction, and every later query went to a dead handle. Under the current
 * interface the same defect shows up one step earlier: `start` throws when a
 * transaction is already open, so a `trx` left set after a commit makes the NEXT
 * `start` fail outright rather than quietly reusing the corpse.
 *
 * That is not a theoretical ordering problem in this package. `uow` resolves
 * once on the worker's root container (there is no child scope anywhere in
 * `apps/media-worker`), so ONE transaction slot serves the whole process — and
 * inside a single image job the claim commits before the completion phase opens
 * its own boundary. See `sequential jobs` below, which is that failure at the
 * level it actually occurred.
 *
 * Knex is faked here because the assertion is about the uow's own bookkeeping —
 * how many transactions it opened, and whether it reused one it had finished.
 */
import { describe, expect, it, jest } from '@jest/globals';
import type { Logger } from '@packages/infrastructure';
import type { Knex } from 'knex';
import { build__UnitOfWork } from '../infrastructure/repositories/unitOfWork';

type FakeTrx = { id: number; commit: jest.Mock; rollback: jest.Mock; committed: boolean };

const createLogger = (): Logger => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
  debug: jest.fn(),
});

/**
 * Hands out a distinct transaction object per `database.transaction()` call, so
 * "did it open a new one?" is answerable by identity rather than by counting
 * side effects.
 */
const createDatabase = (options: { commitThrows?: boolean } = {}) => {
  const opened: FakeTrx[] = [];
  const database = {
    transaction: () => {
      const trx: FakeTrx = {
        id: opened.length + 1,
        committed: false,
        commit: jest.fn(() => {
          if (options.commitThrows) {
            return Promise.reject(new Error('commit failed: connection lost'));
          }
          trx.committed = true;
          return Promise.resolve();
        }),
        rollback: jest.fn(() => Promise.resolve()),
      };
      opened.push(trx);
      return Promise.resolve(trx);
    },
  } as unknown as Knex;
  return { database, opened };
};

const buildUow = (options: { commitThrows?: boolean } = {}) => {
  const { database, opened } = createDatabase(options);
  const uow = build__UnitOfWork({ database, logger: createLogger() });
  return { uow, opened };
};

describe('build__UnitOfWork (worker-core)', () => {
  describe('When a transaction is committed and work resumes', () => {
    it('should open a NEW transaction on the next start, not reuse the committed one', async () => {
      const { uow, opened } = buildUow();

      await uow.start();
      const first = uow.db();
      await uow.complete(true);

      await uow.start();
      const second = uow.db();

      expect(opened).toHaveLength(2);
      expect(second).not.toBe(first);
      // The first one really was committed — this is not a "never committed" pass.
      expect(opened[0].commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('When a transaction is rolled back and work resumes', () => {
    it('should open a NEW transaction on the next start', async () => {
      const { uow, opened } = buildUow();

      await uow.start();
      const first = uow.db();
      await uow.complete(false);

      await uow.start();

      expect(opened).toHaveLength(2);
      expect(uow.db()).not.toBe(first);
      expect(opened[0].rollback).toHaveBeenCalledTimes(1);
    });
  });

  describe('When the commit itself throws', () => {
    it('should still clear the handle, so the error path cannot leave a dead transaction', async () => {
      // This is the whole reason the reset lives in a `finally`. Reset it only
      // on the success path and a failed commit reinstates the original bug —
      // with the added cruelty that it only bites when something else is
      // already going wrong.
      const { uow, opened } = buildUow({ commitThrows: true });

      await uow.start();
      const first = uow.db();
      await expect(uow.complete(true)).rejects.toThrow('commit failed');

      await uow.start();

      expect(opened).toHaveLength(2);
      expect(uow.db()).not.toBe(first);
    });
  });

  describe('When no transaction is open', () => {
    it('should refuse db() rather than hand back a stale handle', async () => {
      const { uow } = buildUow();

      await uow.start();
      await uow.complete(true);

      expect(() => uow.db()).toThrow(/Transaction not started/);
    });
  });

  describe('When flagRollbackOnly was set on a previous transaction', () => {
    it('should not carry the flag into the next one', async () => {
      const { uow, opened } = buildUow();

      await uow.start();
      uow.flagRollbackOnly();
      await uow.complete(true);
      expect(opened[0].rollback).toHaveBeenCalledTimes(1);

      // A stale rollback flag would silently discard the NEXT job's writes.
      await uow.start();
      await uow.complete(true);

      expect(opened[1].commit).toHaveBeenCalledTimes(1);
      expect(opened[1].rollback).not.toHaveBeenCalled();
    });
  });

  describe('When two sequential jobs run through the same process-wide uow', () => {
    it('should give each job its own transaction', async () => {
      // The real failure. `uow` is resolved once on the worker's root container,
      // so job 2 inherits whatever job 1 left behind. Before the fix, job 2's
      // first phase reused job 1's committed handle and every query threw.
      const { uow, opened } = buildUow();

      const runJob = async () => {
        // claim: commits on its own so the PROCESSING flip is visible to peers
        const claimTrx = await uow.inTransaction(async () => uow.db());

        // ...S3 + sharp happen here, outside any transaction...

        // completion: must open a fresh transaction, not reuse the committed claim
        const completeTrx = await uow.inTransaction(async () => uow.db());

        return { claimTrx, completeTrx };
      };

      const jobOne = await runJob();
      const jobTwo = await runJob();

      // Four phases, four transactions — no handle reused anywhere.
      expect(opened).toHaveLength(4);
      const used = [jobOne.claimTrx, jobOne.completeTrx, jobTwo.claimTrx, jobTwo.completeTrx];
      expect(new Set(used).size).toBe(4);
      for (const trx of opened) {
        expect(trx.commit).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('When a task leaves a transaction open and the loop cleans up after it', () => {
    it('should clear it so the next task starts clean', async () => {
      // The run loop's safety net: `if (uow.isOpen()) await uow.complete(false)`
      // after every task. That is what stops an abandoned transaction from being
      // handed to the next task.
      const { uow, opened } = buildUow();

      await uow.start();
      const abandoned = uow.db();
      expect(uow.isOpen()).toBe(true);
      await uow.complete(false);

      await uow.start();

      expect(opened).toHaveLength(2);
      expect(uow.db()).not.toBe(abandoned);
      expect(opened[0].rollback).toHaveBeenCalledTimes(1);
    });

    it('should report not-open when nothing is open, so the net never fires', async () => {
      // `complete` throws with no transaction open, so `isOpen` is what makes the
      // loop's unconditional-looking cleanup safe on the normal path.
      const { uow, opened } = buildUow();

      expect(uow.isOpen()).toBe(false);
      await expect(uow.complete(false)).rejects.toThrow(/Transaction not started/);

      expect(opened).toHaveLength(0);
    });
  });

  describe('inTransaction', () => {
    it('should commit when the callback returns, and hand back its value', async () => {
      const { uow, opened } = buildUow();

      const result = await uow.inTransaction(async () => 'done');

      expect(result).toBe('done');
      expect(opened).toHaveLength(1);
      expect(opened[0].commit).toHaveBeenCalledTimes(1);
      expect(uow.isOpen()).toBe(false);
    });

    it('should roll back and rethrow the original error when the callback throws', async () => {
      const { uow, opened } = buildUow();

      await expect(
        uow.inTransaction(async () => {
          throw new Error('pipeline blew up');
        }),
      ).rejects.toThrow('pipeline blew up');

      expect(opened[0].rollback).toHaveBeenCalledTimes(1);
      expect(opened[0].commit).not.toHaveBeenCalled();
      // Cleared either way, so the next phase can open its own boundary.
      expect(uow.isOpen()).toBe(false);
    });

    it('should honour flagRollbackOnly even though the callback returned normally', async () => {
      // Fail-as-data: the unit reports a failure through its return value rather
      // than a throw, and still needs the writes discarded.
      const { uow, opened } = buildUow();

      const result = await uow.inTransaction(async () => {
        uow.flagRollbackOnly();
        return { outcome: 'notOwned' };
      });

      expect(result).toEqual({ outcome: 'notOwned' });
      expect(opened[0].rollback).toHaveBeenCalledTimes(1);
      expect(opened[0].commit).not.toHaveBeenCalled();
    });

    it('should refuse to nest — a second boundary inside the first throws', async () => {
      const { uow, opened } = buildUow();

      await expect(
        uow.inTransaction(async () => {
          await uow.inTransaction(async () => 'inner');
        }),
      ).rejects.toThrow(/Transaction already open/);

      // The outer boundary is still rolled back rather than left dangling.
      expect(opened).toHaveLength(1);
      expect(opened[0].rollback).toHaveBeenCalledTimes(1);
    });
  });
});
