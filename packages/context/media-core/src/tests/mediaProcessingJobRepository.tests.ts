import { describe, expect, it, jest } from '@jest/globals';
import { MediaJobStatus } from '@packages/contracts';
import { build__MediaProcessingJobRepository } from '../repositories/mediaProcessingJob/mediaProcessingJobRepository';
import type { UnitOfWork } from '../infrastructure/repositories/unitOfWork';

const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

/**
 * media-core owns the ENQUEUE half of the processing queue — the API side.
 * Claiming and settling live in `@packages/worker-core`, whose copy of this
 * repository has no `enqueueIfNoneActive` at all. These two cases moved here
 * from `apps/media-worker` when the split diverged the two packages: the worker
 * never enqueues, so they could not stay there.
 *
 * The boundary verbs are the point:
 *
 * - `join()` attaches to whatever transaction the scope already has open (or
 *   opens one lazily) and does NOT settle it — the enqueue rides the caller's
 *   request.
 * - `beginIsolatedOnly()` demands a fresh boundary. The enqueue must never use
 *   it; only the worker's claim does.
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
        // The enqueue-before-commit guard: the insert JOINS the transaction the
        // finalize is already writing on, and settles nothing. Its own boundary —
        // or a complete() here — would publish the job row before the item's
        // PROCESSING status commits, and a hot worker would claim it against a
        // still-PENDING item.
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
});
