/**
 * The commit/reset fix, media-core's copy.
 *
 * Same defect as worker-core's: `completeTransaction` reset only on the
 * rollback branch, so a successful commit left `trx` truthy and pointing at a
 * COMMITTED transaction, and the next caller issued its queries against a dead
 * handle. The reset now happens in a `finally`, which is what keeps a THROWN
 * commit from reinstating the bug.
 *
 * media-core's copy carries the post-commit event bus on top of that, so these
 * cases also pin the interaction: publishing happens after the commit, on a
 * fresh transaction, and it must not resurrect the settled one.
 *
 * Knex is faked — the assertion is the uow's own bookkeeping: how many
 * transactions it opened, and whether it ever reused one it had finished.
 */
import { describe, expect, it, jest } from '@jest/globals';
import type { Logger } from '@packages/infrastructure';
import type { Knex } from 'knex';
import type { DomainEvent } from '../domainEvents/domainEvent';
import type { EventPublisher } from '../domainEvents/eventPublisher';
import { build__UnitOfWork } from '../infrastructure/repositories/unitOfWork';

type FakeTrx = { id: number; commit: jest.Mock; rollback: jest.Mock };

const createLogger = (): Logger => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
  debug: jest.fn(),
});

const createDatabase = (options: { commitThrows?: boolean } = {}) => {
  const opened: FakeTrx[] = [];
  const database = {
    transaction: () => {
      const trx: FakeTrx = {
        id: opened.length + 1,
        commit: jest.fn(() =>
          options.commitThrows
            ? Promise.reject(new Error('commit failed: connection lost'))
            : Promise.resolve(),
        ),
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
  const published: DomainEvent[][] = [];
  const eventPublisher = {
    publish: jest.fn((events: DomainEvent[]) => {
      published.push(events);
      return Promise.resolve();
    }),
  } as unknown as EventPublisher;
  const uow = build__UnitOfWork({ database, eventPublisher, scopedLogger: createLogger() });
  return { uow, opened, published, eventPublisher };
};

const anEvent = (kind: string): DomainEvent => ({ kind }) as unknown as DomainEvent;

describe('build__UnitOfWork (media-core)', () => {
  describe('When a transaction is committed and work resumes', () => {
    it('should open a NEW transaction on the next start, not reuse the committed one', async () => {
      const { uow, opened } = buildUow();

      await uow.start();
      const first = uow.db();
      await uow.complete(true);

      await uow.start();

      expect(opened).toHaveLength(2);
      expect(uow.db()).not.toBe(first);
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
      // Why the reset is in a `finally`: without it, a failed commit leaves the
      // same dead-handle bug behind, and only when something is already wrong.
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

  describe('When events were collected', () => {
    it('should publish them only after the commit', async () => {
      const { uow, opened, eventPublisher } = buildUow();

      await uow.start();
      uow.collectEvents([anEvent('AlbumCreated')]);
      expect(eventPublisher.publish).not.toHaveBeenCalled();

      await uow.complete(true);

      expect(opened[0].commit).toHaveBeenCalledTimes(1);
      expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    });

    it('should not publish them when the transaction rolled back', async () => {
      const { uow, eventPublisher } = buildUow();

      await uow.start();
      uow.collectEvents([anEvent('AlbumCreated')]);
      await uow.complete(false);

      expect(eventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should not re-publish them on the next transaction', async () => {
      // Events are cleared by the same reset. Leave them and every later commit
      // in the process replays the first request's events.
      const { uow, published } = buildUow();

      await uow.start();
      uow.collectEvents([anEvent('AlbumCreated')]);
      await uow.complete(true);

      await uow.start();
      await uow.complete(true);

      expect(published).toHaveLength(1);
      expect(published[0].map((e) => e.kind)).toEqual(['AlbumCreated']);
    });
  });

  describe('When flagRollbackOnly was set on a previous transaction', () => {
    it('should not carry the flag into the next one', async () => {
      const { uow, opened } = buildUow();

      await uow.start();
      uow.flagRollbackOnly();
      await uow.complete(true);
      expect(opened[0].rollback).toHaveBeenCalledTimes(1);

      // A stale flag would silently discard the NEXT request's writes.
      await uow.start();
      await uow.complete(true);

      expect(opened[1].commit).toHaveBeenCalledTimes(1);
      expect(opened[1].rollback).not.toHaveBeenCalled();
    });
  });

  describe('When a request abandons an open transaction', () => {
    it('should clear it on complete(false) so the next request starts clean', async () => {
      const { uow, opened } = buildUow();

      await uow.start();
      const abandoned = uow.db();
      await uow.complete(false);

      await uow.start();

      expect(opened).toHaveLength(2);
      expect(uow.db()).not.toBe(abandoned);
      expect(opened[0].rollback).toHaveBeenCalledTimes(1);
    });

    it('should refuse complete() when nothing is open rather than silently pass', async () => {
      // The forgiving `settle(ok)` is gone: a boundary that completes twice, or
      // completes something it never opened, is a wiring bug and now says so.
      const { uow, opened } = buildUow();

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
    });

    it('should roll back and rethrow the original error when the callback throws', async () => {
      const { uow, opened } = buildUow();

      await expect(
        uow.inTransaction(async () => {
          throw new Error('write failed');
        }),
      ).rejects.toThrow('write failed');

      expect(opened[0].rollback).toHaveBeenCalledTimes(1);
      expect(opened[0].commit).not.toHaveBeenCalled();
    });

    it('should honour flagRollbackOnly even though the callback returned normally', async () => {
      // Fail-as-data: a mutation field that returns a failed OperationResult never
      // reaches the GraphQL errors channel, so the flag is how the rollback intent
      // travels.
      const { uow, opened } = buildUow();

      const result = await uow.inTransaction(async () => {
        uow.flagRollbackOnly();
        return 'failed-as-data';
      });

      expect(result).toBe('failed-as-data');
      expect(opened[0].rollback).toHaveBeenCalledTimes(1);
      expect(opened[0].commit).not.toHaveBeenCalled();
    });

    it('should publish collected events after the commit, not before', async () => {
      const { uow, opened, eventPublisher } = buildUow();

      await uow.inTransaction(async () => {
        uow.collectEvents([anEvent('AlbumCreated')]);
        expect(eventPublisher.publish).not.toHaveBeenCalled();
      });

      expect(opened[0].commit).toHaveBeenCalledTimes(1);
      expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    });

    it('should not publish events collected on a rolled-back callback', async () => {
      const { uow, eventPublisher } = buildUow();

      await expect(
        uow.inTransaction(async () => {
          uow.collectEvents([anEvent('AlbumCreated')]);
          throw new Error('write failed');
        }),
      ).rejects.toThrow('write failed');

      expect(eventPublisher.publish).not.toHaveBeenCalled();
    });
  });
});
