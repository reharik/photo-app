import { describe, expect, it, jest } from '@jest/globals';
import { MediaItemStatus } from '@packages/contracts';
import { build__MediaDeletionJobRepository } from '@packages/media-core';
import { DatabaseError } from 'pg';

import type { AppCradle } from '../generated/ioc-composed.js';

const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('build__MediaDeletionJobRepository', () => {
  describe('enqueueIfNoneActive', () => {
    describe('When insert succeeds', () => {
      it('should insert a pending job row with storage key snapshot', async () => {
        const inserts: unknown[] = [];
        const database = Object.assign(
          jest.fn(() => ({
            insert: (row: unknown) => {
              inserts.push(row);
              return Promise.resolve();
            },
          })),
          { fn: { now: () => 'NOW()' } },
        );

        const repo = build__MediaDeletionJobRepository({ database } as AppCradle);
        await repo.enqueueIfNoneActive({
          mediaItemId: 'mid-1',
          storageKey: 'media/u1/m1',
          actorId: ACTOR_ID,
        });

        expect(inserts).toHaveLength(1);
        expect(inserts[0]).toEqual(
          expect.objectContaining({
            mediaItemId: 'mid-1',
            storageKey: 'media/u1/m1',
            status: MediaItemStatus.pending.value,
            attemptCount: 0,
            createdBy: ACTOR_ID,
            updatedBy: ACTOR_ID,
          }),
        );
        expect(typeof (inserts[0] as { id: string }).id).toBe('string');
      });
    });

    describe('When insert fails with unique violation', () => {
      it('should swallow the error', async () => {
        const err = new DatabaseError('duplicate key', 10, 'error');
        err.code = '23505';

        const database = Object.assign(
          jest.fn(() => ({
            insert: () => Promise.reject(err),
          })),
          { fn: { now: () => 'NOW()' } },
        );

        const repo = build__MediaDeletionJobRepository({ database } as AppCradle);
        await expect(
          repo.enqueueIfNoneActive({
            mediaItemId: 'mid-1',
            storageKey: 'media/u1/m1',
            actorId: ACTOR_ID,
          }),
        ).resolves.toBeUndefined();
      });
    });
  });

  describe('markPendingRetry', () => {
    describe('When called', () => {
      it('should reset the job to pending with a new available time', async () => {
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

        const repo = build__MediaDeletionJobRepository({ database } as AppCradle);
        const when = new Date('2026-01-15T12:00:00.000Z');
        await repo.markPendingRetry('job-1', ACTOR_ID, 'transient', when);

        expect(updates[0]).toEqual(
          expect.objectContaining({
            status: MediaItemStatus.pending.value,
            availableAt: when,
            startedAt: null,
            updatedBy: ACTOR_ID,
          }),
        );
      });
    });
  });
});
