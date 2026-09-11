import { describe, expect, it, jest } from '@jest/globals';
import { MediaJobStatus } from '@packages/contracts';
import type { UnitOfWork } from '../infrastructure/repositories/unitOfWork';
import { build__MediaProcessingJobRepository } from '../repositories/mediaProcessingJob/mediaProcessingJobRepository';

const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

/**
 * media-core owns the ENQUEUE half of the processing queue — the API side.
 * Claiming and settling live in `@packages/worker-core`, whose copy of this
 * repository has no `enqueueIfNoneActive` at all. These two cases moved here
 * from `apps/media-worker` when the split diverged the two packages: the worker
 * never enqueues, so they could not stay there.
 *
 * The enqueue writes through `uow.db()` and nothing else. It does not open or
 * close a boundary — the GraphQL write plugin owns the request transaction — so
 * the insert lands on whatever transaction the finalize is already writing on.
 * That is the enqueue-before-commit guard, and it is now structural: `db()`
 * throws outside a boundary, so there is no path on which this repository could
 * publish the job row on a transaction of its own.
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
    inTransaction: async <T>(fn: () => Promise<T>) => fn(),
  } as unknown as UnitOfWork;
  return { uow, db };
};

describe('build__MediaProcessingJobRepository', () => {
  describe('enqueueIfNoneActive', () => {
    describe('When called', () => {
      it('should insert a pending job row on the request transaction with ON CONFLICT DO NOTHING', async () => {
        const inserts: unknown[] = [];
        const chains: string[] = [];
        const { uow } = createFakeUow(() => ({
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
});
