/**
 * GUARD: the stalled-media-job sweep reclaims media_processing_job rows stranded in
 * PROCESSING by a worker that died mid-job — and touches NOTHING else.
 *
 * Why this matters now: since migration 0027 the one-active-job-per-item partial
 * unique index actually enforces, so a stranded PROCESSING row blocks re-enqueue for
 * its item forever — the upload silently never completes and a retry does nothing.
 * The sweep (releaseStalledJobs) flips rows whose startedAt predates the stall
 * threshold back to PENDING so the queue can claim them again.
 *
 * These are autocommit table-gateway writes — no UoW involved. Rows are arranged by
 * direct insert with a backdated startedAt; producing a real stall is not attempted.
 * The slow-cadence timer is the interval gate's behavior, not this task's, and is
 * deliberately untested here.
 */
import { randomUUID } from 'node:crypto';

import { jest } from '@jest/globals';
import { MediaItemStatus, MediaKind } from '@packages/contracts';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';

import { build__StalledMediaJobSweep } from '../../../media-worker/src/tasks/schedule/stalledMediaJobSweep/stalledMediaJobSweep.js';
import type { AppCradle } from '../di/generated/ioc-composed.js';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID, TEST_VIEWER_B_ID } from './testViewerIds';

const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60_000);

type JobRow = {
  id: string;
  mediaItemId: string;
  status: string;
  attemptCount: number;
  availableAt: Date;
  startedAt?: Date;
  lastError?: string;
  createdBy: string;
  updatedBy: string;
};

describe('stalled media job sweep (integration)', () => {
  let container: AwilixContainer<AppCradle>;
  let database: Knex;

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    database = container.resolve('database');
  });

  afterEach(async () => {
    await resetIntegrationTestDb(database);
  });

  const createFakeLogger = () => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
  });

  const createSweep = () => {
    const logger = createFakeLogger();
    const sweep = build__StalledMediaJobSweep({
      logger,
      mediaProcessingJobRepository: container.resolve('mediaProcessingJobRepository'),
    });
    return { sweep, logger };
  };

  /** Each job needs its own media_item: FK, plus the (now working) one-active-per-item index. */
  const insertItem = async (): Promise<string> => {
    const id = randomUUID();
    await database('mediaItem').insert({
      id,
      ownerId: TEST_VIEWER_1_ID,
      kind: MediaKind.photo.value,
      mimeType: 'image/png',
      sizeBytes: 67,
      status: MediaItemStatus.processing.value,
      createdBy: TEST_VIEWER_1_ID,
      updatedBy: TEST_VIEWER_1_ID,
    });
    return id;
  };

  const insertJob = async (seed: {
    status: string;
    startedAt?: Date;
    attemptCount?: number;
    availableAt?: Date;
    createdBy?: string;
    updatedBy?: string;
  }): Promise<string> => {
    const id = randomUUID();
    const row: Record<string, unknown> = {
      id,
      mediaItemId: await insertItem(),
      status: seed.status,
      attemptCount: seed.attemptCount ?? 1,
      availableAt: seed.availableAt ?? minutesAgo(30),
      createdBy: seed.createdBy ?? TEST_VIEWER_1_ID,
      updatedBy: seed.updatedBy ?? TEST_VIEWER_1_ID,
    };
    if (seed.startedAt !== undefined) {
      row.startedAt = seed.startedAt;
    }
    await database('mediaProcessingJob').insert(row);
    return id;
  };

  const getJob = (id: string): Promise<JobRow> =>
    database('mediaProcessingJob').where({ id }).first<JobRow>();

  describe('when a PROCESSING row started beyond the stall threshold', () => {
    it('releases it back to PENDING, available now, with the reclaim recorded', async () => {
      const insertedAvailableAt = minutesAgo(30);
      const jobId = await insertJob({
        status: MediaItemStatus.processing.value,
        startedAt: minutesAgo(20),
        availableAt: insertedAvailableAt,
      });

      const { sweep, logger } = createSweep();
      const outcome = await sweep();

      expect(outcome).toBe('processed');
      expect(logger.warn).toHaveBeenCalledTimes(1);

      const row = await getJob(jobId);
      expect(row.status).toBe(MediaItemStatus.pending.value);
      expect(row.startedAt).toBeUndefined();
      expect(row.lastError).toBe('Reclaimed: stalled in PROCESSING');
      // availableAt advanced from the backdated value to the reclaim time, so the
      // queue's `availableAt <= now` claim predicate matches again.
      expect(row.availableAt.getTime()).toBeGreaterThan(insertedAvailableAt.getTime());
    });
  });

  describe('when a PROCESSING row started just now (live job in flight)', () => {
    it('is untouched — every column, not just status', async () => {
      const jobId = await insertJob({
        status: MediaItemStatus.processing.value,
        startedAt: new Date(),
        attemptCount: 3,
      });
      const before = await getJob(jobId);

      const { sweep, logger } = createSweep();
      const outcome = await sweep();

      expect(outcome).toBe('idle');
      expect(logger.warn).not.toHaveBeenCalled();
      // Full-row equality: reclaiming a live job out from under its worker would
      // let a second worker claim it concurrently.
      expect(await getJob(jobId)).toEqual(before);
    });
  });

  describe('when a PENDING row is old enough to match the time predicate', () => {
    it('is untouched — the status predicate holds', async () => {
      const jobId = await insertJob({
        status: MediaItemStatus.pending.value,
        startedAt: minutesAgo(20),
      });
      const before = await getJob(jobId);

      const { sweep } = createSweep();
      const outcome = await sweep();

      expect(outcome).toBe('idle');
      expect(await getJob(jobId)).toEqual(before);
    });
  });

  describe('when a stalled row has accumulated attempts', () => {
    it('keeps attemptCount — resetting it would give a poison item infinite retries', async () => {
      const jobId = await insertJob({
        status: MediaItemStatus.processing.value,
        startedAt: minutesAgo(20),
        attemptCount: 2,
      });

      const { sweep } = createSweep();
      await sweep();

      const row = await getJob(jobId);
      expect(row.status).toBe(MediaItemStatus.pending.value);
      expect(row.attemptCount).toBe(2);
    });
  });

  describe('when the reclaimed row was created and last updated by different actors', () => {
    it('stamps updatedBy from the row own createdBy (bare column reference)', async () => {
      const jobId = await insertJob({
        status: MediaItemStatus.processing.value,
        startedAt: minutesAgo(20),
        createdBy: TEST_VIEWER_1_ID,
        updatedBy: TEST_VIEWER_B_ID,
      });

      const { sweep } = createSweep();
      await sweep();

      const row = await getJob(jobId);
      // database.ref('createdBy') must emit `updated_by = "created_by"` — a bound
      // parameter here would stamp a literal string, not the row's own column.
      expect(row.updatedBy).toBe(TEST_VIEWER_1_ID);
      expect(row.updatedBy).toBe(row.createdBy);
    });
  });

  describe('when two rows are stalled', () => {
    it('releases both and reports the count', async () => {
      await insertJob({ status: MediaItemStatus.processing.value, startedAt: minutesAgo(20) });
      await insertJob({ status: MediaItemStatus.processing.value, startedAt: minutesAgo(25) });

      const { sweep, logger } = createSweep();
      const outcome = await sweep();

      expect(outcome).toBe('processed');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('released 2'));

      const released = await database('mediaProcessingJob').where({
        status: MediaItemStatus.pending.value,
      });
      expect(released).toHaveLength(2);
    });
  });

  describe('when nothing is stalled', () => {
    it('returns idle and logs nothing — the normal case on every slow tick', async () => {
      const { sweep, logger } = createSweep();
      const outcome = await sweep();

      expect(outcome).toBe('idle');
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
      expect(logger.http).not.toHaveBeenCalled();
      expect(logger.verbose).not.toHaveBeenCalled();
      expect(logger.debug).not.toHaveBeenCalled();
    });
  });
});
