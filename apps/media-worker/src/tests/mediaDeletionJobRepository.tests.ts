import { describe, expect, it, jest } from '@jest/globals';
import { MediaJobStatus } from '@packages/contracts';
import { build__MediaDeletionJobRepository, type UnitOfWork } from '@packages/media-core';

const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

/** Mirrors createJobQueueRepository's policy constants. */
const RETRY_BASE_SECONDS = 30;
const MAX_ATTEMPTS = 3;

type Update = { table: unknown; data: Record<string, unknown> };

/**
 * `uow.db()` stand-in that records which table each write landed on. The
 * deletion queue composes the same generic factory as the processing queue, so
 * the table it was configured with is part of what these tests pin.
 */
const createFakeUow = (row: Record<string, unknown> | undefined) => {
  const updates: Update[] = [];
  const db = Object.assign(
    jest.fn((table: string) => ({
      where: () => ({
        first: () => Promise.resolve(row),
        update: (data: Record<string, unknown>) => {
          updates.push({ table, data });
          return Promise.resolve(1);
        },
      }),
    })),
    {
      fn: { now: () => 'NOW()' },
      raw: (sql: string, bindings: unknown[]) => ({ sql, bindings }),
    },
  );
  const uow = {
    begin: async () => {},
    db: () => db,
    complete: async () => {},
  } as unknown as UnitOfWork;
  return { uow, updates };
};

describe('build__MediaDeletionJobRepository', () => {
  describe('markPendingRetry', () => {
    describe('When attempts remain', () => {
      it('should reset the job to pending with a backoff interval it computes itself', async () => {
        // The caller no longer passes an availableAt: backoff is queue policy and
        // lives in the repository. attemptCount was already bumped at claim time,
        // so the first retry (attemptCount 1) waits the base interval.
        const { uow, updates } = createFakeUow({ attempt_count: 1 });

        const repo = build__MediaDeletionJobRepository({ uow });
        const outcome = await repo.markPendingRetry('job-1', ACTOR_ID, 'transient');

        expect(outcome).toBe('retrying');
        expect(updates).toHaveLength(1);
        expect(updates[0].table).toBe('mediaDeletionJob');
        expect(updates[0].data).toEqual(
          expect.objectContaining({
            status: MediaJobStatus.pending.value,
            availableAt: {
              sql: "now() + (? || ' seconds')::interval",
              bindings: [RETRY_BASE_SECONDS],
            },
            lastError: 'transient',
            updatedBy: ACTOR_ID,
          }),
        );
      });

      it('should double the backoff for each attempt already spent', async () => {
        const { uow, updates } = createFakeUow({ attempt_count: 2 });

        const repo = build__MediaDeletionJobRepository({ uow });
        await repo.markPendingRetry('job-1', ACTOR_ID, 'transient');

        expect(updates[0].data.availableAt).toEqual({
          sql: "now() + (? || ' seconds')::interval",
          bindings: [RETRY_BASE_SECONDS * 2],
        });
      });
    });

    describe('When the attempt cap is already spent', () => {
      it('should terminal-fail the job instead of requeueing it forever', async () => {
        const { uow, updates } = createFakeUow({ attempt_count: MAX_ATTEMPTS });

        const repo = build__MediaDeletionJobRepository({ uow });
        const outcome = await repo.markPendingRetry('job-1', ACTOR_ID, 'transient');

        expect(outcome).toBe('exhausted');
        expect(updates).toHaveLength(1);
        expect(updates[0].table).toBe('mediaDeletionJob');
        expect(updates[0].data).toEqual(
          expect.objectContaining({
            status: MediaJobStatus.failed.value,
            lastError: `attempts exhausted (${MAX_ATTEMPTS}): transient`,
            updatedBy: ACTOR_ID,
          }),
        );
      });
    });

    describe('When the job is no longer owned', () => {
      it('should report notOwned and write nothing', async () => {
        const { uow, updates } = createFakeUow(undefined);

        const repo = build__MediaDeletionJobRepository({ uow });
        const outcome = await repo.markPendingRetry('job-1', ACTOR_ID, 'transient');

        expect(outcome).toBe('notOwned');
        expect(updates).toEqual([]);
      });
    });
  });

  describe('markSucceeded', () => {
    describe('When called', () => {
      it('should complete the deletion job on its own table', async () => {
        const { uow, updates } = createFakeUow(undefined);

        const repo = build__MediaDeletionJobRepository({ uow });
        await repo.markSucceeded('job-1', ACTOR_ID);

        expect(updates).toHaveLength(1);
        // The shared queue factory is configured per queue; a hardcoded table
        // here would complete the wrong queue's job row.
        expect(updates[0].table).toBe('mediaDeletionJob');
        expect(updates[0].data).toEqual(
          expect.objectContaining({
            status: MediaJobStatus.succeeded.value,
            updatedBy: ACTOR_ID,
          }),
        );
      });
    });
  });
});
