import { describe, expect, it, jest } from '@jest/globals';
import { MediaItemStatus } from '@packages/contracts';
import { build__MediaDeletionJobRepository } from '@packages/media-core';

import type { AppCradle } from '../generated/ioc-composed.js';

const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('build__MediaDeletionJobRepository', () => {
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
