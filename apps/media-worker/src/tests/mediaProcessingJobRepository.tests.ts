import { describe, expect, it, jest } from '@jest/globals';
import { MediaJobStatus } from '@packages/contracts';
import { build__MediaProcessingJobRepository, type UnitOfWork } from '@packages/worker-core';

const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

/**
 * The repository is built from an injected `uow` rather than a raw Knex handle,
 * but it no longer drives the boundary: every method just calls `uow.db()`, which
 * throws outside a transaction. Opening and closing is the caller's job — the
 * task's `run()` wraps each phase in `uow.inTransaction(...)` — so there is
 * nothing about transaction lifecycle left for these cases to assert.
 *
 * `tableFn` stands in for `uow.db()` — knex's callable table accessor — so a
 * test supplies one function and gets the whole builder chain from it.
 */
const createFakeUow = (tableFn: (table?: string) => unknown) => {
  const db = Object.assign(jest.fn(tableFn), {
    fn: { now: () => 'NOW()' },
    raw: jest.fn((sql: string, bindings?: unknown) => ({ sql, bindings })),
  });
  const uow = {
    start: async () => {},
    db: () => db,
    complete: async () => {},
    isOpen: () => true,
    inTransaction: async <T>(fn: () => Promise<T>) => fn(),
  } as unknown as UnitOfWork;
  return { uow, db };
};

/**
 * Claim-and-mark only. `enqueueIfNoneActive` is NOT on worker-core's copy of
 * this repository — enqueueing is the API's half of the queue and lives in
 * `@packages/media-core`, so its two cases moved to that package's suite
 * (`packages/context/media-core/src/tests/mediaProcessingJobRepository.tests.ts`).
 */
describe('build__MediaProcessingJobRepository', () => {
  describe('markSucceeded', () => {
    describe('When called', () => {
      it('should update the job to succeeded', async () => {
        const updates: unknown[] = [];
        const tables: unknown[] = [];
        const { uow } = createFakeUow((table) => {
          tables.push(table);
          return {
            where: () => ({
              update: (data: unknown) => {
                updates.push(data);
                return Promise.resolve(1);
              },
            }),
          };
        });

        const repo = build__MediaProcessingJobRepository({ uow });
        await repo.markSucceeded('job-1', ACTOR_ID);

        expect(tables).toEqual(['mediaProcessingJob']);
        expect(updates[0]).toEqual(
          expect.objectContaining({
            status: MediaJobStatus.succeeded.value,
            updatedBy: ACTOR_ID,
          }),
        );
      });
    });
  });

  describe('markFailed', () => {
    describe('When the error message is very long', () => {
      it('should truncate lastError to 8000 characters', async () => {
        const updates: Array<{ lastError?: string }> = [];
        const { uow } = createFakeUow(() => ({
          where: () => ({
            update: (data: { lastError?: string }) => {
              updates.push(data);
              return Promise.resolve(1);
            },
          }),
        }));

        const repo = build__MediaProcessingJobRepository({ uow });
        const longMessage = 'x'.repeat(9000);
        await repo.markFailed('job-1', ACTOR_ID, longMessage);

        expect(updates[0].lastError?.length).toBe(8000);
        expect(updates[0].lastError?.endsWith('...')).toBe(true);
      });
    });
  });

  describe('claimNextAvailableJob', () => {
    describe('When no row is available', () => {
      it('should return undefined without issuing the claiming update', async () => {
        const selectChain = {
          where: () => selectChain,
          andWhere: () => selectChain,
          orderBy: () => selectChain,
          forUpdate: () => selectChain,
          skipLocked: () => selectChain,
          limit: () => selectChain,
          select: () => Promise.resolve([]),
        };

        let dbCalls = 0;
        const { uow } = createFakeUow(() => {
          dbCalls += 1;
          if (dbCalls === 1) {
            return selectChain;
          }
          throw new Error('unexpected second query in empty-job scenario');
        });

        const repo = build__MediaProcessingJobRepository({ uow });
        const result = await repo.claimNextAvailableJob();

        expect(result).toBeUndefined();
        // An empty FOR UPDATE SKIP LOCKED select stops there: no row was locked,
        // so there is nothing to flip to PROCESSING. The `dbCalls` guard above is
        // what makes a second query a failure rather than a silent extra write.
        expect(dbCalls).toBe(1);
      });
    });

    describe('When a pending row is claimed', () => {
      it('should flip the locked row to PROCESSING and return it', async () => {
        const jobId = 'job-claim-1';
        const mediaItemId = 'media-claim-1';

        const selectChain = {
          where: () => selectChain,
          andWhere: () => selectChain,
          orderBy: () => selectChain,
          forUpdate: () => selectChain,
          skipLocked: () => selectChain,
          limit: () => selectChain,
          select: () => Promise.resolve([{ id: jobId }]),
        };

        const updatedRow = {
          id: jobId,
          mediaItemId,
          status: MediaJobStatus.processing.value,
          attemptCount: 1,
          availableAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: ACTOR_ID,
          updatedBy: ACTOR_ID,
        };

        let dbCalls = 0;
        const { uow } = createFakeUow(() => {
          dbCalls += 1;
          if (dbCalls === 1) {
            return selectChain;
          }
          return {
            where: () => ({
              update: () => ({
                // `withEnumRevival` attaches a queryContext to the builder and
                // returns it; the mock resolves to the rows from there.
                returning: () => ({
                  queryContext: () => Promise.resolve([updatedRow]),
                }),
              }),
            }),
          };
        });

        const repo = build__MediaProcessingJobRepository({ uow });
        const result = await repo.claimNextAvailableJob();

        expect(result).toEqual(updatedRow);
        // Select-then-update, both on the caller's transaction: the lock taken by
        // the select has to still be held when the update lands.
        expect(dbCalls).toBe(2);
      });
    });
  });
});
