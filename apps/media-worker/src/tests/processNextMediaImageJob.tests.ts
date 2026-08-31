import { describe, expect, it, jest } from '@jest/globals';
import { MediaAssetKind, MediaItemStatus, MediaKind } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type {
  MediaItemOwner,
  MediaItemRepository,
  MediaProcessingJobRepository,
  MediaProcessingJobRow,
  SystemMediaItemRepository,
  UnitOfWork,
} from '@packages/media-core';
import { MediaItem } from '@packages/media-core';

import type { ClaimJobRow } from '../tasks/queue/mediaWorkers/processMediaImage/claimJobRow.js';
import { build__ClaimJobRow } from '../tasks/queue/mediaWorkers/processMediaImage/claimJobRow.js';
import type {
  CompleteJobRow,
  CompletionResult,
} from '../tasks/queue/mediaWorkers/processMediaImage/completeJobRow.js';
import { build__CompleteJobRow } from '../tasks/queue/mediaWorkers/processMediaImage/completeJobRow.js';
import type {
  MediaJobWorkflow,
  PipelineJobWorkflow,
  PipelineResult,
} from '../tasks/queue/mediaWorkers/processMediaImage/processNextMediaImageJob.js';
import { build__ProcessNextMediaImageJob } from '../tasks/queue/mediaWorkers/processMediaImage/processNextMediaImageJob.js';
import type { RecordJobFailure } from '../tasks/queue/mediaWorkers/processMediaImage/recordJobFailure.js';
import { build__RecordJobFailure } from '../tasks/queue/mediaWorkers/processMediaImage/recordJobFailure.js';
import type { RunImageStoragePipeline } from '../tasks/queue/mediaWorkers/processMediaImage/runImageStoragePipeline.js';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const MEDIA_ITEM_ID = '33333333-3333-4333-8333-333333333333';
const JOB_ID = '44444444-4444-4444-8444-444444444444';

const createMockLogger = (): Logger =>
  ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;

const jobRow = (attemptCount = 1): MediaProcessingJobRow =>
  ({
    id: JOB_ID,
    mediaItemId: MEDIA_ITEM_ID,
    status: MediaItemStatus.processing,
    attemptCount,
    availableAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: ACTOR_ID,
    updatedBy: ACTOR_ID,
    startedAt: new Date(),
  }) as unknown as MediaProcessingJobRow;

const createJobRepo = () => ({
  enqueueIfNoneActive: jest.fn<MediaProcessingJobRepository['enqueueIfNoneActive']>(),
  claimNextAvailableJob: jest
    .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
    .mockResolvedValue(jobRow()),
  markSucceeded: jest.fn<MediaProcessingJobRepository['markSucceeded']>().mockResolvedValue(true),
  markFailed: jest.fn<MediaProcessingJobRepository['markFailed']>().mockResolvedValue(true),
  markPendingRetry: jest
    .fn<MediaProcessingJobRepository['markPendingRetry']>()
    .mockResolvedValue('retrying'),
  releaseStalledJobs: jest.fn<MediaProcessingJobRepository['releaseStalledJobs']>(),
});

const createItemRepo = (item?: MediaItem) => ({
  getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
  save: jest.fn<MediaItemRepository['save']>().mockResolvedValue(undefined),
  delete: jest.fn<MediaItemRepository['delete']>(),
  ensureUserTagId: jest.fn<MediaItemRepository['ensureUserTagId']>(),
});

/** The claim-time projection: id/owner/kind/status only, not the aggregate. */
const itemProjection = (
  status: MediaItemStatus,
  kind: MediaKind = MediaKind.photo,
): MediaItemOwner => ({
  id: MEDIA_ITEM_ID,
  ownerId: ACTOR_ID,
  kind,
  status,
});

const createSystemItemRepo = (item: MediaItemOwner | undefined) =>
  ({
    getMediaItemById: jest
      .fn<SystemMediaItemRepository['getMediaItemById']>()
      .mockResolvedValue(item as MediaItemOwner),
  }) as unknown as SystemMediaItemRepository & {
    getMediaItemById: jest.Mock<SystemMediaItemRepository['getMediaItemById']>;
  };

/** A photo aggregate sitting in PROCESSING, i.e. ready for the pipeline result. */
const processingPhoto = (): MediaItem => {
  const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ACTOR_ID);
  item.addAsset(MediaAssetKind.original, 'image/jpeg');
  item.completeUploadedWithMetadata(
    { sizeBytes: 10, mimeType: 'image/jpeg' },
    MediaKind.photo,
    ACTOR_ID,
  );
  return item;
};

const pipelineResult = (): PipelineResult => ({
  capture: {},
  displayAsset: {
    kind: MediaAssetKind.display,
    mimeType: 'image/jpeg',
    sizeBytes: 2048,
    width: 1200,
    height: 800,
  },
  thumbnailAsset: {
    kind: MediaAssetKind.thumbnail,
    mimeType: 'image/jpeg',
    sizeBytes: 512,
    width: 200,
    height: 200,
  },
});

/**
 * Each unit drives its own transaction boundary now — there is no scope wrapper
 * between it and the uow — so the uow IS the oracle. Whether a phase commits or
 * rolls back is the whole point of these units, so `complete(ok)`'s argument is
 * captured rather than discarded. `db()` throws: every collaborator is faked, so
 * a unit reaching for the handle directly is a mistake, not a silent undefined.
 */
const createFakeUow = () => {
  const commits: boolean[] = [];
  const uow = {
    id: 'fake-uow',
    beginIsolatedOnly: async () => {},
    join: async () => {},
    db: () => {
      throw new Error('db() is not available in this unit test');
    },
    complete: async (ok: boolean) => {
      commits.push(ok);
    },
    settle: async () => {},
    collectEvents: () => {},
    flagRollbackOnly: () => {},
  } as unknown as UnitOfWork;
  return { uow, commits };
};

describe('build__ClaimJobRow', () => {
  const build = (item: MediaItemOwner | undefined, job: MediaProcessingJobRow | undefined) => {
    const mediaProcessingJobRepository = createJobRepo();
    mediaProcessingJobRepository.claimNextAvailableJob.mockResolvedValue(job);
    const systemMediaItemRepository = createSystemItemRepo(item);
    const { uow, commits } = createFakeUow();
    const claimJobRow = build__ClaimJobRow({
      mediaProcessingJobRepository,
      systemMediaItemRepository,
      logger: createMockLogger(),
      uow,
    });
    return { claimJobRow, mediaProcessingJobRepository, commits };
  };

  describe('When the queue is empty', () => {
    it('should report idle without touching the job row', async () => {
      const { claimJobRow, mediaProcessingJobRepository, commits } = build(undefined, undefined);

      const result = await claimJobRow();

      expect(result).toEqual({
        status: 'stop',
        level: 'debug',
        outcome: 'idle',
        message: 'No jobs ready',
      });
      expect(mediaProcessingJobRepository.markFailed).not.toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markSucceeded).not.toHaveBeenCalled();
      // Nothing was read or written, so no boundary was opened to settle.
      expect(commits).toEqual([]);
    });
  });

  describe('When the media item is missing', () => {
    it('should fail the job terminally', async () => {
      const { claimJobRow, mediaProcessingJobRepository, commits } = build(undefined, jobRow());

      const result = await claimJobRow();

      expect(result.status).toBe('stop');
      expect(mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        'media item not found',
      );
      expect(mediaProcessingJobRepository.markPendingRetry).not.toHaveBeenCalled();
      // Every guard path owns its boundary: the verdict has to be committed, not
      // left open for the loop's settle to roll back.
      expect(commits).toEqual([true]);
    });
  });

  describe('When a non-photo was enqueued for image processing', () => {
    it('should fail the job terminally — no retry will make it a photo', async () => {
      const { claimJobRow, mediaProcessingJobRepository, commits } = build(
        itemProjection(MediaItemStatus.processing, MediaKind.video),
        jobRow(),
      );

      await claimJobRow();

      expect(mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        'not a photo',
      );
      expect(mediaProcessingJobRepository.markPendingRetry).not.toHaveBeenCalled();
      expect(commits).toEqual([true]);
    });
  });

  describe('When a job is claimed against an already-READY item', () => {
    it('should mark the job succeeded — never failed — so the job table does not lie', async () => {
      const { claimJobRow, mediaProcessingJobRepository, commits } = build(
        itemProjection(MediaItemStatus.ready),
        jobRow(),
      );

      const result = await claimJobRow();

      expect(result.status).toBe('stop');
      expect(mediaProcessingJobRepository.markSucceeded).toHaveBeenCalledWith(JOB_ID, ACTOR_ID);
      expect(mediaProcessingJobRepository.markFailed).not.toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markPendingRetry).not.toHaveBeenCalled();
      expect(commits).toEqual([true]);
    });
  });

  describe('When a job is claimed against a still-PENDING item', () => {
    it('should requeue with backoff, not kill the job', async () => {
      // The enqueue-before-commit race: the job row can become visible a beat
      // before the item's PROCESSING status commits. PENDING is retryable, so a
      // claim that loses that race must come back, not go terminal.
      const { claimJobRow, mediaProcessingJobRepository, commits } = build(
        itemProjection(MediaItemStatus.pending),
        jobRow(),
      );

      const result = await claimJobRow();

      expect(result.status).toBe('stop');
      expect(mediaProcessingJobRepository.markPendingRetry).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        `item not yet processable (${MediaItemStatus.pending.value})`,
      );
      expect(mediaProcessingJobRepository.markFailed).not.toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markSucceeded).not.toHaveBeenCalled();
      expect(commits).toEqual([true]);
    });
  });

  describe('When a job is claimed against an already-FAILED item', () => {
    it('should fail the job without resurrecting the item', async () => {
      const { claimJobRow, mediaProcessingJobRepository, commits } = build(
        itemProjection(MediaItemStatus.failed),
        jobRow(),
      );

      const result = await claimJobRow();

      expect(result.status).toBe('stop');
      // The reason is written to lastError, not left blank: a terminal job row has
      // to say which item state abandoned it.
      expect(mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        `item abandoned (${MediaItemStatus.failed.value})`,
      );
      expect(mediaProcessingJobRepository.markPendingRetry).not.toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markSucceeded).not.toHaveBeenCalled();
      expect(commits).toEqual([true]);
    });
  });

  describe('When the item is processable', () => {
    it('should hand the claimed job on to the pipeline', async () => {
      const job = jobRow();
      const { claimJobRow, mediaProcessingJobRepository, commits } = build(
        itemProjection(MediaItemStatus.processing),
        job,
      );

      const result = await claimJobRow();

      expect(result).toEqual({ status: 'continue', job });
      expect(mediaProcessingJobRepository.markFailed).not.toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markSucceeded).not.toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markPendingRetry).not.toHaveBeenCalled();
      // The claim's own read closes before the pipeline runs — it must not hold a
      // transaction open across the S3 round trip.
      expect(commits).toEqual([true]);
    });
  });
});

describe('build__CompleteJobRow', () => {
  const build = (item: MediaItem | undefined, claimed = true) => {
    const mediaProcessingJobRepository = createJobRepo();
    mediaProcessingJobRepository.markSucceeded.mockResolvedValue(claimed);
    const mediaItemRepository = createItemRepo(item);
    const { uow, commits } = createFakeUow();
    const completeJobRow = build__CompleteJobRow({
      mediaProcessingJobRepository,
      mediaItemRepository,
      uow,
    });
    return { completeJobRow, mediaItemRepository, mediaProcessingJobRepository, commits };
  };

  describe('When the job is still owned and the item applies cleanly', () => {
    it('should apply the results, save the item, and commit', async () => {
      const item = processingPhoto();
      const { completeJobRow, mediaItemRepository, commits } = build(item);

      const result = await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      expect(result).toEqual({ outcome: 'completed' });
      expect(item.status()).toBe(MediaItemStatus.ready);
      expect(item.width()).toBe(1200);
      expect(item.height()).toBe(800);
      expect(mediaItemRepository.save).toHaveBeenCalledWith(item);
      expect(commits).toEqual([true]);
    });
  });

  describe('When the stalled sweep already reclaimed the job', () => {
    it('should report notOwned and roll back without touching the item', async () => {
      const item = processingPhoto();
      const { completeJobRow, mediaItemRepository, commits } = build(item, false);

      const result = await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      expect(result.outcome).toBe('notOwned');
      // Ownership is decided by the job-row update; losing it must stop us before
      // we read, let alone write, the item.
      expect(mediaItemRepository.getById).not.toHaveBeenCalled();
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
      expect(commits).toEqual([false]);
    });
  });

  describe('When the item was deleted mid-pipeline', () => {
    it('should report itemGone and roll back', async () => {
      const { completeJobRow, mediaItemRepository, commits } = build(undefined);

      const result = await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      expect(result.outcome).toBe('itemGone');
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
      expect(commits).toEqual([false]);
    });
  });

  describe('When the aggregate rejects the results', () => {
    it('should report applyFailed and roll back so the job can be requeued', async () => {
      // Still PENDING — never finalized — so applyProcessingResults refuses it.
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ACTOR_ID);
      const { completeJobRow, mediaItemRepository, commits } = build(item);

      const result = await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      expect(result.outcome).toBe('applyFailed');
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
      expect(commits).toEqual([false]);
    });
  });
});

describe('build__RecordJobFailure', () => {
  const build = (item: MediaItem | undefined) => {
    const mediaProcessingJobRepository = createJobRepo();
    const mediaItemRepository = createItemRepo(item);
    const { uow, commits } = createFakeUow();
    const recordJobFailure = build__RecordJobFailure({
      mediaProcessingJobRepository,
      mediaItemRepository,
      uow,
    });
    return { recordJobFailure, mediaItemRepository, mediaProcessingJobRepository, commits };
  };

  describe('When the failure is retryable and attempts remain', () => {
    it('should requeue the job and leave the item in PROCESSING', async () => {
      const item = processingPhoto();
      const { recordJobFailure, mediaItemRepository, mediaProcessingJobRepository } = build(item);
      mediaProcessingJobRepository.markPendingRetry.mockResolvedValue('retrying');

      await recordJobFailure(jobRow(), ACTOR_ID, 'S3 timeout', true);

      expect(mediaProcessingJobRepository.markPendingRetry).toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markFailed).not.toHaveBeenCalled();
      // The job is coming back, so the item must NOT be dragged to FAILED.
      expect(item.status()).toBe(MediaItemStatus.processing);
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('When the failure is retryable but attempts are exhausted', () => {
    it('should fail the item too, so the upload stops hanging in PROCESSING', async () => {
      const item = processingPhoto();
      const { recordJobFailure, mediaItemRepository, mediaProcessingJobRepository } = build(item);
      mediaProcessingJobRepository.markPendingRetry.mockResolvedValue('exhausted');

      await recordJobFailure(jobRow(), ACTOR_ID, 'S3 timeout', true);

      expect(item.status()).toBe(MediaItemStatus.failed);
      expect(mediaItemRepository.save).toHaveBeenCalledWith(item);
    });
  });

  describe('When the failure is not retryable', () => {
    it('should terminal-fail the job and the item without consulting the cap', async () => {
      const item = processingPhoto();
      const { recordJobFailure, mediaItemRepository, mediaProcessingJobRepository } = build(item);

      await recordJobFailure(jobRow(), ACTOR_ID, 'not a photo', false);

      expect(mediaProcessingJobRepository.markFailed).toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markPendingRetry).not.toHaveBeenCalled();
      expect(item.status()).toBe(MediaItemStatus.failed);
      expect(mediaItemRepository.save).toHaveBeenCalledWith(item);
    });
  });

  describe('When the job is no longer ours', () => {
    it('should leave the item alone — someone else owns the outcome', async () => {
      const item = processingPhoto();
      const { recordJobFailure, mediaItemRepository, mediaProcessingJobRepository } = build(item);
      mediaProcessingJobRepository.markFailed.mockResolvedValue(false);

      await recordJobFailure(jobRow(), ACTOR_ID, 'boom', false);

      expect(item.status()).toBe(MediaItemStatus.processing);
      expect(mediaItemRepository.getById).not.toHaveBeenCalled();
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
    });
  });
});

describe('build__ProcessNextMediaImageJob', () => {
  const build = (overrides: {
    claim?: MediaJobWorkflow;
    pipeline?: PipelineJobWorkflow | (() => Promise<PipelineJobWorkflow>);
    completion?: CompletionResult;
  }) => {
    const claimJobRow = jest
      .fn<ClaimJobRow>()
      .mockResolvedValue(overrides.claim ?? { status: 'continue', job: jobRow() });

    const runImageStoragePipeline = jest.fn<RunImageStoragePipeline>();
    if (typeof overrides.pipeline === 'function') {
      runImageStoragePipeline.mockImplementation(overrides.pipeline);
    } else {
      runImageStoragePipeline.mockResolvedValue(
        overrides.pipeline ?? { status: 'continue', pipelineResult: pipelineResult() },
      );
    }

    const completeJobRow = jest
      .fn<CompleteJobRow>()
      .mockResolvedValue(overrides.completion ?? { outcome: 'completed' });
    const recordJobFailure = jest.fn<RecordJobFailure>().mockResolvedValue(undefined);
    const logger = createMockLogger();

    const run = build__ProcessNextMediaImageJob({
      logger,
      claimJobRow,
      runImageStoragePipeline,
      completeJobRow,
      recordJobFailure,
    });
    return { run, logger, runImageStoragePipeline, completeJobRow, recordJobFailure };
  };

  describe('When the claim stops the job', () => {
    it('should return the claim outcome without running the pipeline', async () => {
      const { run, runImageStoragePipeline, recordJobFailure } = build({
        claim: { status: 'stop', level: 'debug', outcome: 'idle', message: 'No jobs ready' },
      });

      await expect(run()).resolves.toBe('idle');
      expect(runImageStoragePipeline).not.toHaveBeenCalled();
      // The claim already settled the job row; the runner must not double-write.
      expect(recordJobFailure).not.toHaveBeenCalled();
    });
  });

  describe('When the storage pipeline stops', () => {
    it('should record a terminal, non-retryable failure', async () => {
      const { run, recordJobFailure, completeJobRow } = build({
        pipeline: { status: 'stop', message: 'Original object not found in storage' },
      });

      await expect(run()).resolves.toBe('processed');
      expect(completeJobRow).not.toHaveBeenCalled();
      expect(recordJobFailure).toHaveBeenCalledWith(
        expect.objectContaining({ id: JOB_ID }),
        ACTOR_ID,
        'Original object not found in storage',
        false,
      );
    });
  });

  describe('When completion succeeds', () => {
    it('should report processed and record no failure', async () => {
      const { run, recordJobFailure } = build({});

      await expect(run()).resolves.toBe('processed');
      expect(recordJobFailure).not.toHaveBeenCalled();
    });
  });

  describe('When the results could not be applied', () => {
    it('should record a RETRYABLE failure so the rolled-back work is reattempted', async () => {
      const { run, recordJobFailure } = build({
        completion: { outcome: 'applyFailed', message: 'Could not apply results' },
      });

      await expect(run()).resolves.toBe('processed');
      expect(recordJobFailure).toHaveBeenCalledWith(
        expect.objectContaining({ id: JOB_ID }),
        ACTOR_ID,
        'Could not apply results',
        true,
      );
    });
  });

  describe('When the job was reclaimed or its item vanished', () => {
    it('should not record a failure — the rollback already undid the work', async () => {
      const { run, recordJobFailure, logger } = build({
        completion: { outcome: 'notOwned', message: 'Job no longer owned' },
      });

      await expect(run()).resolves.toBe('processed');
      expect(recordJobFailure).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Job no longer owned');
    });
  });

  describe('When the pipeline throws', () => {
    it('should record a retryable failure for an ordinary error', async () => {
      const { run, recordJobFailure } = build({
        pipeline: () => Promise.reject(new Error('socket hang up')),
      });

      await expect(run()).resolves.toBe('processed');
      expect(recordJobFailure).toHaveBeenCalledWith(
        expect.objectContaining({ id: JOB_ID }),
        ACTOR_ID,
        'socket hang up',
        true,
      );
    });

    it('should record a NON-retryable failure for a programmer error', async () => {
      // A TypeError will not fix itself on the next attempt; retrying it just
      // burns the attempt budget.
      const { run, recordJobFailure } = build({
        pipeline: () => Promise.reject(new TypeError('x is not a function')),
      });

      await expect(run()).resolves.toBe('processed');
      expect(recordJobFailure).toHaveBeenCalledWith(
        expect.objectContaining({ id: JOB_ID }),
        ACTOR_ID,
        'x is not a function',
        false,
      );
    });
  });
});
