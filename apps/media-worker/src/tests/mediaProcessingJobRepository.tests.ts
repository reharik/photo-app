import { describe, expect, it, jest } from '@jest/globals';
import { MediaJobStatus } from '@packages/contracts';
import { build__MediaProcessingJobRepository, type UnitOfWork } from '@packages/media-core';

const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

/**
 * The queue mechanics moved onto the unit of work: the repository is built from
 * an injected `uow` rather than a raw Knex handle. Two boundary verbs, and the
 * difference between them is the point:
 *
 * - `join()` attaches to whatever transaction the scope already has open (or opens
 *   one lazily) and does NOT settle it — the enqueue rides the caller's request.
 * - `beginIsolatedOnly()` demands a fresh boundary and throws if one is already
 *   open — the claim must commit independently, never as a savepoint.
 *
 * `tableFn` stands in for `uow.db()` — knex's callable table accessor — so a
 * test supplies one function and gets the whole builder chain from it.
 */
const createFakeUow = (tableFn: (table?: string) => unknown) => {
  const boundary: { joined: number; begun: number; completed: boolean[] } = {
    joined: 0,
    begun: 0,
    completed: [],
  };
  const db = Object.assign(jest.fn(tableFn), {
    fn: { now: () => 'NOW()' },
    raw: jest.fn((sql: string, bindings?: unknown) => ({ sql, bindings })),
  });
  const uow = {
    join: async () => {
      boundary.joined += 1;
    },
    beginIsolatedOnly: async () => {
      boundary.begun += 1;
    },
    db: () => db,
    complete: async (ok: boolean) => {
      boundary.completed.push(ok);
    },
    settle: async (ok: boolean) => {
      boundary.completed.push(ok);
    },
  } as unknown as UnitOfWork;
  return { uow, db, boundary };
};

describe('build__MediaProcessingJobRepository', () => {
  describe('enqueueIfNoneActive', () => {
    describe('When called', () => {
      it('should insert a pending job row on the request transaction with ON CONFLICT DO NOTHING', async () => {
        const inserts: unknown[] = [];
        const chains: string[] = [];
        const { uow, boundary } = createFakeUow(() => ({
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
        }));

        const repo = build__MediaProcessingJobRepository({ uow });
        await repo.enqueueIfNoneActive({ mediaItemId: 'mid-1', actorId: ACTOR_ID });

        expect(inserts).toHaveLength(1);
        expect(inserts[0]).toEqual(
          expect.objectContaining({
            mediaItemId: 'mid-1',
            status: MediaJobStatus.pending.value,
            attemptCount: 0,
            createdBy: ACTOR_ID,
            updatedBy: ACTOR_ID,
          }),
        );
        expect(typeof (inserts[0] as { id: string }).id).toBe('string');
        // Targetless ON CONFLICT DO NOTHING (any arbiter, incl. the partial unique
        // index) — NOT try/catch on 23505, which would abort the caller's trx.
        expect(chains).toEqual(['onConflict()', 'ignore()']);
        // The enqueue-before-commit guard, restated for the scoped uow: the insert
        // JOINS the transaction the finalize is already writing on, and settles
        // nothing. Its own boundary — or a complete() here — would publish the job
        // row before the item's PROCESSING status commits, and a hot worker would
        // claim it against a still-PENDING item.
        expect(boundary.joined).toBe(1);
        expect(boundary.begun).toBe(0);
        expect(boundary.completed).toEqual([]);
      });
    });

    describe('When the insert fails for a non-conflict reason', () => {
      it('should propagate the error', async () => {
        const { uow } = createFakeUow(() => ({
          insert: () => ({
            onConflict: () => ({
              ignore: () => Promise.reject(new Error('connection refused')),
            }),
          }),
        }));

        const repo = build__MediaProcessingJobRepository({ uow });
        await expect(
          repo.enqueueIfNoneActive({ mediaItemId: 'mid-1', actorId: ACTOR_ID }),
        ).rejects.toThrow('connection refused');
      });
    });
  });

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
      it('should return undefined and settle its own transaction boundary', async () => {
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
        const { uow, boundary } = createFakeUow(() => {
          dbCalls += 1;
          if (dbCalls === 1) {
            return selectChain;
          }
          throw new Error('unexpected second query in empty-job scenario');
        });

        const repo = build__MediaProcessingJobRepository({ uow });
        const result = await repo.claimNextAvailableJob();

        expect(result).toBeUndefined();
        // The claim must commit independently, never leave the boundary open —
        // FOR UPDATE SKIP LOCKED is worthless if the lock outlives the claim. It
        // begins in isolation rather than joining, so a caller's open transaction
        // is a hard error here, not a silently nested savepoint.
        expect(boundary.begun).toBe(1);
        expect(boundary.joined).toBe(0);
        expect(boundary.completed).toEqual([true]);
      });
    });

    describe('When a pending row is claimed', () => {
      it('should return the updated job row and commit the claim', async () => {
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
        const { uow, boundary } = createFakeUow(() => {
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
        expect(boundary.begun).toBe(1);
        expect(boundary.completed).toEqual([true]);
      });
    });
  });
});
