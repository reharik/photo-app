import { describe, expect, it, jest } from '@jest/globals';
import { MediaProcessingJobStatus } from '@packages/media-core';
import { DatabaseError } from 'pg';

import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';
import { build__MediaProcessingJobRepository } from '../repositories/domainRepositories/mediaProcessingJobRepository';

const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('build__MediaProcessingJobRepository', () => {
  describe('enqueueIfNoneActive', () => {
    describe('When insert succeeds', () => {
      it('should insert a pending job row', async () => {
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

        const repo = build__MediaProcessingJobRepository({ database } as IocGeneratedCradle);
        await repo.enqueueIfNoneActive({ mediaItemId: 'mid-1', actorId: ACTOR_ID });

        expect(inserts).toHaveLength(1);
        expect(inserts[0]).toEqual(
          expect.objectContaining({
            mediaItemId: 'mid-1',
            status: MediaProcessingJobStatus.pending,
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

        const repo = build__MediaProcessingJobRepository({ database } as IocGeneratedCradle);
        await expect(
          repo.enqueueIfNoneActive({ mediaItemId: 'mid-1', actorId: ACTOR_ID }),
        ).resolves.toBeUndefined();
      });
    });

    describe('When insert fails for another reason', () => {
      it('should propagate the error', async () => {
        const database = Object.assign(
          jest.fn(() => ({
            insert: () => Promise.reject(new Error('connection refused')),
          })),
          { fn: { now: () => 'NOW()' } },
        );

        const repo = build__MediaProcessingJobRepository({ database } as IocGeneratedCradle);
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

        const repo = build__MediaProcessingJobRepository({ database } as IocGeneratedCradle);
        await repo.markSucceeded('job-1', ACTOR_ID);

        expect(updates[0]).toEqual(
          expect.objectContaining({
            status: MediaProcessingJobStatus.succeeded,
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

        const repo = build__MediaProcessingJobRepository({ database } as IocGeneratedCradle);
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

        const repo = build__MediaProcessingJobRepository({ database } as IocGeneratedCradle);
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
          status: MediaProcessingJobStatus.processing,
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
                  returning: () => Promise.resolve([updatedRow]),
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

        const repo = build__MediaProcessingJobRepository({ database } as IocGeneratedCradle);
        const result = await repo.claimNextAvailableJob();

        expect(result).toEqual(updatedRow);
      });
    });
  });
});
