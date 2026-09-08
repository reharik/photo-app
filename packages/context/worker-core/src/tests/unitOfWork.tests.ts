/**
 * The commit/reset fix, and why it is a `finally`.
 *
 * `completeTransaction` used to call `reset()` on the rollback branch only. A
 * successful commit therefore left `trx` truthy and pointing at a COMMITTED
 * transaction — and `join()` short-circuits when `trx` is set. The next unit of
 * work in the same process then issued every query against a dead handle.
 *
 * That is not a theoretical ordering problem in this package. `uow` resolves
 * once on the worker's root container (there is no child scope anywhere in
 * `apps/media-worker`), so ONE transaction slot serves the whole process — and
 * inside a single image job, `claimJobRow` commits before `completeJobRow`
 * joins. See `sequential jobs` below, which is that failure at the level it
 * actually occurred.
 *
 * Knex is faked here because the assertion is about the uow's own bookkeeping —
 * how many transactions it opened, and whether it reused one it had finished.
 */
import { describe, expect, it, jest } from '@jest/globals';
import type { Knex } from 'knex';
import type { Logger } from '@packages/infrastructure';
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
    it('should open a NEW transaction on the next join, not reuse the committed one', async () => {
      const { uow, opened } = buildUow();

      await uow.join();
      const first = uow.db();
      await uow.complete(true);

      await uow.join();
      const second = uow.db();

      expect(opened).toHaveLength(2);
      expect(second).not.toBe(first);
      // The first one really was committed — this is not a "never committed" pass.
      expect(opened[0].commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('When a transaction is rolled back and work resumes', () => {
    it('should open a NEW transaction on the next join', async () => {
      const { uow, opened } = buildUow();

      await uow.join();
      const first = uow.db();
      await uow.complete(false);

      await uow.join();

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

      await uow.join();
      const first = uow.db();
      await expect(uow.complete(true)).rejects.toThrow('commit failed');

      await uow.join();

      expect(opened).toHaveLength(2);
      expect(uow.db()).not.toBe(first);
    });
  });

  describe('When no transaction is open', () => {
    it('should refuse db() rather than hand back a stale handle', async () => {
      const { uow } = buildUow();

      await uow.join();
      await uow.complete(true);

      expect(() => uow.db()).toThrow(/Transaction not started/);
    });
  });

  describe('When flagRollbackOnly was set on a previous transaction', () => {
    it('should not carry the flag into the next one', async () => {
      const { uow, opened } = buildUow();

      await uow.join();
      uow.flagRollbackOnly();
      await uow.complete(true);
      expect(opened[0].rollback).toHaveBeenCalledTimes(1);

      // A stale rollback flag would silently discard the NEXT job's writes.
      await uow.join();
      await uow.complete(true);

      expect(opened[1].commit).toHaveBeenCalledTimes(1);
      expect(opened[1].rollback).not.toHaveBeenCalled();
    });
  });

  describe('When two sequential jobs run through the same process-wide uow', () => {
    it('should give each job its own transaction', async () => {
      // The real failure. `uow` is resolved once on the worker's root container,
      // so job 2 inherits whatever job 1 left behind. Before the fix, job 2's
      // join() reused job 1's committed handle and every query threw.
      const { uow, opened } = buildUow();

      const runJob = async () => {
        // claim: commits on its own so the PROCESSING flip is visible to peers
        await uow.join();
        const claimTrx = uow.db();
        await uow.complete(true);

        // ...S3 + sharp happen here, outside any transaction...

        // completion: must open a fresh transaction, not rejoin the committed claim
        await uow.join();
        const completeTrx = uow.db();
        await uow.complete(true);

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

  describe('When a task leaves a transaction open and the loop settles it', () => {
    it('should clear it so the next task starts clean', async () => {
      // The run loop calls settle(false) after every task; that is what stops an
      // abandoned transaction from being handed to the next task.
      const { uow, opened } = buildUow();

      await uow.join();
      const abandoned = uow.db();
      await uow.settle(false);

      await uow.join();

      expect(opened).toHaveLength(2);
      expect(uow.db()).not.toBe(abandoned);
      expect(opened[0].rollback).toHaveBeenCalledTimes(1);
    });

    it('should be a no-op when nothing is open', async () => {
      const { uow, opened } = buildUow();

      await uow.settle(false);

      expect(opened).toHaveLength(0);
    });
  });
});
