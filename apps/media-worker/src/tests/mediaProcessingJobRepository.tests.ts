import { describe, expect, it, jest } from '@jest/globals';
import { MediaItemStatus } from '@packages/contracts';
import { build__MediaProcessingJobRepository, type UnitOfWork } from '@packages/media-core';

import type { AppCradle } from '../generated/ioc-composed.js';

const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

/** The repo itself is constructed on the raw singleton handle (claim path). */
const rawDatabase = Object.assign(jest.fn(), { fn: { now: () => 'NOW()' } });

/**
 * Fake uow whose db() records inserts and the conflict-handling chain — the enqueue
 * must go through the caller's transaction, never the raw handle.
 */
const createFakeUow = () => {
  const inserts: unknown[] = [];
  const chains: string[] = [];
  const trx = Object.assign(
    jest.fn(() => ({
      insert: (row: unknown) => {
        inserts.push(row);
        return {
          onConflict: (...args: unknown[]) => {
            chains.push(args.length === 0 ? 'onConflict()' : 'onConflict(target)');
            return {
              ignore: () => {
                chains.push('ignore()');
                return Promise.resolve();
              },
            };
          },
        };
      },
    })),
    { fn: { now: () => 'NOW()' } },
  );
  const uow = { db: () => trx } as unknown as UnitOfWork;
  return { uow, inserts, chains };
};

describe('build__MediaProcessingJobRepository', () => {
  describe('enqueueIfNoneActive', () => {
    describe('When called with a unit of work', () => {
      it('should insert a pending job row through the uow transaction with ON CONFLICT DO NOTHING', async () => {
        const { uow, inserts, chains } = createFakeUow();

        const repo = build__MediaProcessingJobRepository({ database: rawDatabase } as AppCradle);
        await repo.enqueueIfNoneActive({ mediaItemId: 'mid-1', actorId: ACTOR_ID }, uow);

        expect(inserts).toHaveLength(1);
        expect(inserts[0]).toEqual(
          expect.objectContaining({
            mediaItemId: 'mid-1',
            status: MediaItemStatus.pending.value,
            attemptCount: 0,
            createdBy: ACTOR_ID,
            updatedBy: ACTOR_ID,
          }),
        );
        expect(typeof (inserts[0] as { id: string }).id).toBe('string');
        // Targetless ON CONFLICT DO NOTHING (any arbiter, incl. the partial unique
        // index) — NOT try/catch on 23505, which would abort the caller's trx.
        expect(chains).toEqual(['onConflict()', 'ignore()']);
        // The raw handle must not have been queried — autocommit here is the
        // enqueue-before-commit race.
        expect(rawDatabase).not.toHaveBeenCalled();
      });
    });

    describe('When the transactional insert fails for a non-conflict reason', () => {
      it('should propagate the error', async () => {
        const trx = Object.assign(
          jest.fn(() => ({
            insert: () => ({
              onConflict: () => ({
                ignore: () => Promise.reject(new Error('connection refused')),
              }),
            }),
          })),
          { fn: { now: () => 'NOW()' } },
        );
        const uow = { db: () => trx } as unknown as UnitOfWork;

        const repo = build__MediaProcessingJobRepository({ database: rawDatabase } as AppCradle);
        await expect(
          repo.enqueueIfNoneActive({ mediaItemId: 'mid-1', actorId: ACTOR_ID }, uow),
        ).rejects.toThrow('connection refused');
      });
    });
  });

  describe('markSucceeded', () => {
    describe('When called', () => {
      it('should update the job to succeeded', async () => {
        const updates: unknown[] = [];
        const database = Object.assign(
          jest.fn(() => ({
            where: () => ({
              update: (data: unknown) => {
                updates.push(data);
                return Promise.resolve();
              },
            }),
          })),
          { fn: { now: () => 'NOW()' } },
        );

        const repo = build__MediaProcessingJobRepository({ database } as AppCradle);
        await repo.markSucceeded('job-1', ACTOR_ID);

        expect(updates[0]).toEqual(
          expect.objectContaining({
            status: MediaItemStatus.succeeded.value,
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
        const database = Object.assign(
          jest.fn(() => ({
            where: () => ({
              update: (data: { lastError?: string }) => {
                updates.push(data);
                return Promise.resolve();
              },
            }),
          })),
          { fn: { now: () => 'NOW()' } },
        );

        const repo = build__MediaProcessingJobRepository({ database } as AppCradle);
        const longMessage = 'x'.repeat(9000);
        await repo.markFailed('job-1', ACTOR_ID, longMessage);

        expect(updates[0].lastError?.length).toBe(8000);
        expect(updates[0].lastError?.endsWith('...')).toBe(true);
      });
    });
  });

  describe('claimNextAvailableJob', () => {
    describe('When no row is available', () => {
      it('should return undefined', async () => {
        const selectChain = {
          where: () => selectChain,
          andWhere: () => selectChain,
          orderBy: () => selectChain,
          forUpdate: () => selectChain,
          skipLocked: () => selectChain,
          limit: () => Promise.resolve([]),
        };

        let trxCalls = 0;
        const trx = Object.assign(
          jest.fn(() => {
            trxCalls += 1;
            if (trxCalls === 1) {
              return selectChain;
            }
            throw new Error('unexpected second query in empty-job scenario');
          }),
          {
            fn: { now: () => 'NOW()' },
            raw: jest.fn(() => 'RAW'),
          },
        );

        const database = Object.assign(jest.fn(), {
          fn: { now: () => 'NOW()' },
          transaction: jest.fn(async (cb: (t: typeof trx) => Promise<unknown>) => cb(trx)),
        });

        const repo = build__MediaProcessingJobRepository({ database } as AppCradle);
        const result = await repo.claimNextAvailableJob();
        expect(result).toBeUndefined();
      });
    });

    describe('When a pending row is claimed', () => {
      it('should return the updated job row', async () => {
        const jobId = 'job-claim-1';
        const mediaItemId = 'media-claim-1';

        const selectChain = {
          where: () => selectChain,
          andWhere: () => selectChain,
          orderBy: () => selectChain,
          forUpdate: () => selectChain,
          skipLocked: () => selectChain,
          limit: () => Promise.resolve([{ id: jobId }]),
        };

        const updatedRow = {
          id: jobId,
          mediaItemId,
          status: MediaItemStatus.processing.value,
          attemptCount: 1,
          availableAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: ACTOR_ID,
          updatedBy: ACTOR_ID,
        };

        let trxCalls = 0;
        const trx = Object.assign(
          jest.fn(() => {
            trxCalls += 1;
            if (trxCalls === 1) {
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
          }),
          {
            fn: { now: () => 'NOW()' },
            raw: jest.fn(() => 'RAW'),
          },
        );

        const database = Object.assign(jest.fn(), {
          fn: { now: () => 'NOW()' },
          transaction: jest.fn(async (cb: (t: typeof trx) => Promise<unknown>) => cb(trx)),
        });

        const repo = build__MediaProcessingJobRepository({ database } as AppCradle);
        const result = await repo.claimNextAvailableJob();

        expect(result).toEqual(updatedRow);
      });
    });
  });
});
