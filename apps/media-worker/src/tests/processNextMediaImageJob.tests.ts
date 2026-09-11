import { describe, expect, it, jest } from '@jest/globals';
import { MediaAssetKind, MediaItemStatus, MediaKind } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type {
  MediaAssetRecord,
  MediaItemOwner,
  MediaItemRepository,
  MediaProcessingJobRepository,
  MediaProcessingJobRow,
  SystemMediaItemRepository,
  UnitOfWork,
} from '@packages/worker-core';
import { MediaItem } from '@packages/worker-core';

import type {
  CompleteJobRow,
  CompletionResult,
} from '../tasks/queue/mediaWorkers/processMediaImage/completeJobRow.js';
import { build__CompleteJobRow } from '../tasks/queue/mediaWorkers/processMediaImage/completeJobRow.js';
import { build__ProcessNextMediaImageJob } from '../tasks/queue/mediaWorkers/processMediaImage/processNextMediaImageJob.js';
import type { RecordJobFailure } from '../tasks/queue/mediaWorkers/processMediaImage/recordJobFailure.js';
import { build__RecordJobFailure } from '../tasks/queue/mediaWorkers/processMediaImage/recordJobFailure.js';
import type { RunImageStoragePipeline } from '../tasks/queue/mediaWorkers/processMediaImage/runImageStoragePipeline.js';
import type { TriageJob } from '../tasks/queue/mediaWorkers/processMediaImage/triageJob.js';
import { build__TriageJob } from '../tasks/queue/mediaWorkers/processMediaImage/triageJob.js';
import type {
  MediaJobWorkflow,
  PipelineJobWorkflow,
  PipelineResult,
} from '../tasks/queue/mediaWorkers/processMediaImage/types.js';

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

/**
 * A photo aggregate as the worker actually finds it: PROCESSING, and carrying
 * NO asset rows. The API stopped creating the original's row when asset
 * ownership moved to the worker, so `applyProcessingResults` is now the sole
 * writer of all three — and it refuses an item that already has any
 * (`AssetKindAlreadyExists`). Rehydrating is the only way to reach PROCESSING
 * here: `completeUploadedWithMetadata` is the API's transition and is not on
 * worker-core's `MediaItem`.
 */
const processingPhoto = (assets: MediaAssetRecord[] = []): MediaItem =>
  MediaItem.rehydrate(
    {
      id: MEDIA_ITEM_ID,
      ownerId: ACTOR_ID,
      kind: MediaKind.photo,
      status: MediaItemStatus.processing,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: ACTOR_ID,
      updatedBy: ACTOR_ID,
    },
    { assets },
  );

/** The item's persisted shape — the repo-facing record, i.e. what reaches the DB. */
const persistedItem = (item: MediaItem) => item.toPersistence();

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
  originalAsset: {
    kind: MediaAssetKind.original,
    mimeType: 'image/png',
    sizeBytes: 8192,
    width: 2400,
    height: 1600,
  },
});

/**
 * The boundary moved UP: `processNextMediaImageJob` wraps each phase in
 * `uow.inTransaction(...)`, and the phases themselves (triage, completion,
 * failure-recording) are now plain repository work with no transaction verbs at
 * all. So this fake is the oracle for the RUNNER only — `boundaries` records one
 * entry per `inTransaction` call and whether it committed or rolled back.
 *
 * `flagRollbackOnly()` is honoured here exactly as the real uow honours it: a
 * callback that flags and then returns normally still comes out as a rollback.
 * That is the fail-as-data path the completion phase uses, so a fake that
 * ignored the flag would show a commit where production rolls back.
 *
 * `db()` throws: every collaborator is faked, so a unit reaching for the handle
 * directly is a mistake, not a silent undefined.
 */
const createFakeUow = (trace: string[] = []) => {
  /** One entry per boundary the runner opened: true = committed, false = rolled back. */
  const boundaries: boolean[] = [];
  let isOpen = false;
  let rollbackOnly = false;
  const uow = {
    id: 'fake-uow',
    start: async () => {
      if (isOpen) {
        throw new Error('Transaction already open when start called');
      }
      isOpen = true;
      rollbackOnly = false;
    },
    db: () => {
      throw new Error('db() is not available in this unit test');
    },
    complete: async (ok: boolean) => {
      if (!isOpen) {
        throw new Error('Transaction not started');
      }
      isOpen = false;
      const committed = ok && !rollbackOnly;
      boundaries.push(committed);
      trace.push(committed ? 'commit' : 'rollback');
    },
    isOpen: () => isOpen,
    flagRollbackOnly: () => {
      rollbackOnly = true;
    },
    collectEvents: () => {},
    inTransaction: async <T>(fn: () => Promise<T>): Promise<T> => {
      await uow.start();
      try {
        const result = await fn();
        await uow.complete(true);
        return result;
      } catch (e) {
        await uow.complete(false);
        throw e;
      }
    },
  } as unknown as UnitOfWork & {
    start: () => Promise<void>;
    complete: (ok: boolean) => Promise<void>;
  };
  return { uow: uow as unknown as UnitOfWork, boundaries, trace };
};

describe('build__TriageJob', () => {
  // Triage no longer claims — the runner claims and hands the row down — and it
  // no longer touches the uow. It is a pure verdict over the item's status, run
  // by the caller inside its own `inTransaction`, so nothing here asserts on
  // transaction lifecycle: there is none left in this unit to assert on.
  const build = (item: MediaItemOwner | undefined) => {
    const mediaProcessingJobRepository = createJobRepo();
    const systemMediaItemRepository = createSystemItemRepo(item);
    const triageJob = build__TriageJob({
      mediaProcessingJobRepository,
      systemMediaItemRepository,
      logger: createMockLogger(),
    });
    return { triageJob, mediaProcessingJobRepository };
  };

  describe('When the media item is missing', () => {
    it('should fail the job terminally', async () => {
      const { triageJob, mediaProcessingJobRepository } = build(undefined);

      const result = await triageJob(jobRow());

      expect(result.status).toBe('stop');
      expect(mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        'media item not found',
      );
      expect(mediaProcessingJobRepository.markPendingRetry).not.toHaveBeenCalled();
    });
  });

  describe('When a non-photo was enqueued for image processing', () => {
    it('should fail the job terminally — no retry will make it a photo', async () => {
      const { triageJob, mediaProcessingJobRepository } = build(
        itemProjection(MediaItemStatus.processing, MediaKind.video),
      );

      await triageJob(jobRow());

      expect(mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        'not a photo',
      );
      expect(mediaProcessingJobRepository.markPendingRetry).not.toHaveBeenCalled();
    });
  });

  describe('When a job is claimed against an already-READY item', () => {
    it('should mark the job succeeded — never failed — so the job table does not lie', async () => {
      const { triageJob, mediaProcessingJobRepository } = build(
        itemProjection(MediaItemStatus.ready),
      );

      const result = await triageJob(jobRow());

      expect(result.status).toBe('stop');
      expect(mediaProcessingJobRepository.markSucceeded).toHaveBeenCalledWith(JOB_ID, ACTOR_ID);
      expect(mediaProcessingJobRepository.markFailed).not.toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markPendingRetry).not.toHaveBeenCalled();
    });
  });

  describe('When a job is claimed against a still-PENDING item', () => {
    it('should requeue with backoff, not kill the job', async () => {
      // The enqueue-before-commit race: the job row can become visible a beat
      // before the item's PROCESSING status commits. PENDING is retryable, so a
      // claim that loses that race must come back, not go terminal.
      const { triageJob, mediaProcessingJobRepository } = build(
        itemProjection(MediaItemStatus.pending),
      );

      const result = await triageJob(jobRow());

      expect(result.status).toBe('stop');
      expect(mediaProcessingJobRepository.markPendingRetry).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        `item not yet processable (${MediaItemStatus.pending.value})`,
      );
      expect(mediaProcessingJobRepository.markFailed).not.toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markSucceeded).not.toHaveBeenCalled();
    });
  });

  describe('When a job is claimed against an already-FAILED item', () => {
    it('should fail the job without resurrecting the item', async () => {
      const { triageJob, mediaProcessingJobRepository } = build(
        itemProjection(MediaItemStatus.failed),
      );

      const result = await triageJob(jobRow());

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
    });
  });

  describe('When the item is processable', () => {
    it('should hand the claimed job on to the pipeline', async () => {
      const job = jobRow();
      const { triageJob, mediaProcessingJobRepository } = build(
        itemProjection(MediaItemStatus.processing),
      );

      const result = await triageJob(job);

      expect(result).toEqual({ status: 'continue', job });
      expect(mediaProcessingJobRepository.markFailed).not.toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markSucceeded).not.toHaveBeenCalled();
      expect(mediaProcessingJobRepository.markPendingRetry).not.toHaveBeenCalled();
    });
  });
});

describe('build__CompleteJobRow', () => {
  // The completion phase is pure repository work now: the runner wraps the whole
  // call in `uow.inTransaction(...)` and flags rollback itself when the outcome is
  // not 'completed'. So what this unit owes its caller is the OUTCOME and the
  // write ORDER — not a commit — and the trace records only the writes.
  const build = (item: MediaItem | undefined, claimed = true) => {
    const trace: string[] = [];
    const mediaProcessingJobRepository = createJobRepo();
    mediaProcessingJobRepository.markSucceeded.mockImplementation(() => {
      trace.push('markSucceeded');
      return Promise.resolve(claimed);
    });
    const mediaItemRepository = createItemRepo(item);
    mediaItemRepository.getById.mockImplementation(() => {
      trace.push('getById');
      return Promise.resolve(item);
    });
    mediaItemRepository.save.mockImplementation(() => {
      trace.push('save');
      return Promise.resolve(undefined);
    });
    const completeJobRow = build__CompleteJobRow({
      mediaProcessingJobRepository,
      mediaItemRepository,
    });
    return { completeJobRow, mediaItemRepository, mediaProcessingJobRepository, trace };
  };

  describe('When the job is still owned and the item applies cleanly', () => {
    it('should apply the results and save the item', async () => {
      const item = processingPhoto();
      const { completeJobRow, mediaItemRepository } = build(item);

      const result = await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      expect(result).toEqual({ outcome: 'completed' });
      const persisted = persistedItem(item);
      expect(persisted.status).toBe(MediaItemStatus.ready.value);
      expect(persisted.width).toBe(1200);
      expect(persisted.height).toBe(800);
      expect(mediaItemRepository.save).toHaveBeenCalledWith(item);
    });

    it('should write all three asset rows — original, display and thumbnail', async () => {
      const item = processingPhoto();
      const { completeJobRow, mediaItemRepository } = build(item);

      await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      // The worker is the only writer of these rows now. A missing one leaves an
      // item marked READY whose derivative S3 holds but the DB does not record.
      const saved = mediaItemRepository.save.mock.calls[0][0] as MediaItem;
      const kinds = saved
        .childEntities()
        .assets.upsert.map((a) => (a.toPersistence() as { kind: string }).kind);
      expect(kinds.sort()).toEqual(
        [
          MediaAssetKind.original.value,
          MediaAssetKind.display.value,
          MediaAssetKind.thumbnail.value,
        ].sort(),
      );
    });

    it('should write the status flip, the re-read and the save as one uninterrupted run', async () => {
      const item = processingPhoto();
      const { completeJobRow, trace } = build(item);

      await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      // The job's status flip, the item's re-read, and the save that carries the
      // three asset rows, in that order and with nothing between them. The unit no
      // longer opens a boundary of its own — the runner's `inTransaction` is what
      // makes these atomic (pinned in the runner's own cases below) — but the
      // ORDER is still this unit's contract: `markSucceeded` is the ownership
      // check, so it has to precede the reads and writes it authorises.
      expect(trace).toEqual(['markSucceeded', 'getById', 'save']);
    });
  });

  describe('When the job fails to apply', () => {
    it('should leave no partial asset state — nothing saved, and applyFailed reported', async () => {
      // PENDING, so applyProcessingResults refuses it.
      const item = MediaItem.create({ kind: MediaKind.photo }, ACTOR_ID);
      const { completeJobRow, mediaItemRepository, trace } = build(item);

      const result = await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      expect(result.outcome).toBe('applyFailed');
      // No save at all. The `markSucceeded` that already ran is undone by the
      // runner rolling the boundary back off this outcome — see the runner's
      // 'rolls the completion boundary back' case.
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
      expect(trace).toEqual(['markSucceeded', 'getById']);
      expect(item.childEntities().assets.upsert).toEqual([]);
    });
  });

  describe('When the stalled sweep already reclaimed the job', () => {
    it('should report notOwned without touching the item', async () => {
      const item = processingPhoto();
      const { completeJobRow, mediaItemRepository } = build(item, false);

      const result = await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      expect(result.outcome).toBe('notOwned');
      // Ownership is decided by the job-row update; losing it must stop us before
      // we read, let alone write, the item.
      expect(mediaItemRepository.getById).not.toHaveBeenCalled();
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('When the item was deleted mid-pipeline', () => {
    it('should report itemGone', async () => {
      const { completeJobRow, mediaItemRepository } = build(undefined);

      const result = await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      expect(result.outcome).toBe('itemGone');
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('When the aggregate rejects the results', () => {
    it('should report applyFailed so the runner can roll back and requeue', async () => {
      // Still PENDING — never finalized — so applyProcessingResults refuses it.
      const item = MediaItem.create({ kind: MediaKind.photo }, ACTOR_ID);
      const { completeJobRow, mediaItemRepository } = build(item);

      const result = await completeJobRow(jobRow(), pipelineResult(), ACTOR_ID);

      expect(result.outcome).toBe('applyFailed');
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
    });
  });
});

describe('build__RecordJobFailure', () => {
  // Also pure repository work now — the runner brackets it. `uow` is still on the
  // dependency type but the factory does not destructure it, so nothing here can
  // assert on a boundary.
  const build = (item: MediaItem | undefined) => {
    const mediaProcessingJobRepository = createJobRepo();
    const mediaItemRepository = createItemRepo(item);
    const { uow } = createFakeUow();
    const recordJobFailure = build__RecordJobFailure({
      mediaProcessingJobRepository,
      mediaItemRepository,
      uow,
    });
    return { recordJobFailure, mediaItemRepository, mediaProcessingJobRepository };
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
      expect(persistedItem(item).status).toBe(MediaItemStatus.processing.value);
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('When the failure is retryable but attempts are exhausted', () => {
    it('should fail the item too, so the upload stops hanging in PROCESSING', async () => {
      const item = processingPhoto();
      const { recordJobFailure, mediaItemRepository, mediaProcessingJobRepository } = build(item);
      mediaProcessingJobRepository.markPendingRetry.mockResolvedValue('exhausted');

      await recordJobFailure(jobRow(), ACTOR_ID, 'S3 timeout', true);

      expect(persistedItem(item).status).toBe(MediaItemStatus.failed.value);
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
      expect(persistedItem(item).status).toBe(MediaItemStatus.failed.value);
      expect(mediaItemRepository.save).toHaveBeenCalledWith(item);
    });
  });

  describe('When the job is no longer ours', () => {
    it('should leave the item alone — someone else owns the outcome', async () => {
      const item = processingPhoto();
      const { recordJobFailure, mediaItemRepository, mediaProcessingJobRepository } = build(item);
      mediaProcessingJobRepository.markFailed.mockResolvedValue(false);

      await recordJobFailure(jobRow(), ACTOR_ID, 'boom', false);

      expect(persistedItem(item).status).toBe(MediaItemStatus.processing.value);
      expect(mediaItemRepository.getById).not.toHaveBeenCalled();
      expect(mediaItemRepository.save).not.toHaveBeenCalled();
    });
  });
});

describe('build__ProcessNextMediaImageJob', () => {
  /**
   * The runner is where the boundaries live now. Each phase — claim, triage,
   * failure-recording, completion — runs inside its own `uow.inTransaction(...)`,
   * with the S3 pipeline deliberately OUTSIDE all of them so no row lock is held
   * across a network round trip. `boundaries` is therefore the oracle for this
   * describe and this describe only: it is the one unit that owns lifecycle.
   */
  const build = (overrides: {
    claimedJob?: MediaProcessingJobRow;
    triage?: MediaJobWorkflow;
    pipeline?: PipelineJobWorkflow | (() => Promise<PipelineJobWorkflow>);
    completion?: CompletionResult;
  }) => {
    const trace: string[] = [];
    const { uow, boundaries } = createFakeUow(trace);

    const claimedJob = 'claimedJob' in overrides ? overrides.claimedJob : jobRow();
    const mediaProcessingJobRepository = createJobRepo();
    mediaProcessingJobRepository.claimNextAvailableJob.mockImplementation(async () => {
      trace.push('claim');
      return claimedJob;
    });

    const triageJob = jest
      .fn<TriageJob>()
      .mockResolvedValue(overrides.triage ?? { status: 'continue', job: claimedJob ?? jobRow() });

    const runImageStoragePipeline = jest.fn<RunImageStoragePipeline>();
    const pipelineImpl = async (): Promise<PipelineJobWorkflow> => {
      trace.push('pipeline');
      if (typeof overrides.pipeline === 'function') {
        return overrides.pipeline();
      }
      return overrides.pipeline ?? { status: 'continue', pipelineResult: pipelineResult() };
    };
    runImageStoragePipeline.mockImplementation(pipelineImpl);

    const completeJobRow = jest
      .fn<CompleteJobRow>()
      .mockResolvedValue(overrides.completion ?? { outcome: 'completed' });
    const recordJobFailure = jest.fn<RecordJobFailure>().mockResolvedValue(undefined);
    const logger = createMockLogger();

    const run = build__ProcessNextMediaImageJob({
      logger,
      runImageStoragePipeline,
      completeJobRow,
      recordJobFailure,
      uow,
      mediaProcessingJobRepository,
      triageJob,
    });
    return {
      run,
      logger,
      runImageStoragePipeline,
      completeJobRow,
      recordJobFailure,
      triageJob,
      mediaProcessingJobRepository,
      boundaries,
      trace,
    };
  };

  describe('When the queue is empty', () => {
    it('should report idle without triaging or running the pipeline', async () => {
      const { run, triageJob, runImageStoragePipeline, boundaries } = build({
        claimedJob: undefined,
      });

      await expect(run()).resolves.toBe('idle');
      expect(triageJob).not.toHaveBeenCalled();
      expect(runImageStoragePipeline).not.toHaveBeenCalled();
      // The claim still gets its own committed boundary — an empty claim is a
      // read that has to close, not one left dangling for the loop's net.
      expect(boundaries).toEqual([true]);
    });
  });

  describe('When triage stops the job', () => {
    it('should return the triage outcome without running the pipeline', async () => {
      const { run, runImageStoragePipeline, recordJobFailure, boundaries } = build({
        triage: {
          status: 'stop',
          level: 'warn',
          outcome: 'processed',
          message: 'Item not yet processable',
        },
      });

      await expect(run()).resolves.toBe('processed');
      expect(runImageStoragePipeline).not.toHaveBeenCalled();
      // Triage already settled the job row; the runner must not double-write.
      expect(recordJobFailure).not.toHaveBeenCalled();
      // Claim and triage each commit on their own — the triage verdict is a write
      // and has to be durable even though the job stops here.
      expect(boundaries).toEqual([true, true]);
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
      const { run, recordJobFailure, boundaries } = build({});

      await expect(run()).resolves.toBe('processed');
      expect(recordJobFailure).not.toHaveBeenCalled();
      // claim, triage, completion — all three committed.
      expect(boundaries).toEqual([true, true, true]);
    });

    it('should run the S3 pipeline OUTSIDE every transaction', async () => {
      // The lock-across-the-network bug. `inTransaction` in the fake flips isOpen
      // for the duration of its callback, so a pipeline that ran inside one would
      // show up between a commit and its boundary here.
      const { run, trace } = build({});

      await run();

      // Each phase's boundary closes before the next thing starts; the pipeline
      // sits between two closed boundaries, not inside one.
      expect(trace).toEqual(['claim', 'commit', 'commit', 'pipeline', 'commit']);
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

    it('should roll the completion boundary back, then commit the failure record separately', async () => {
      // Fail-as-data: completeJobRow REPORTS applyFailed rather than throwing, so
      // without `flagRollbackOnly` the runner would commit the very writes it just
      // decided were wrong — the markSucceeded flip included.
      const { run, boundaries } = build({
        completion: { outcome: 'applyFailed', message: 'Could not apply results' },
      });

      await run();

      // claim, triage, completion (ROLLED BACK), failure record (committed).
      expect(boundaries).toEqual([true, true, false, true]);
    });
  });

  describe('When the job was reclaimed or its item vanished', () => {
    it('should not record a failure — the rollback already undid the work', async () => {
      const { run, recordJobFailure, logger, boundaries } = build({
        completion: { outcome: 'notOwned', message: 'Job no longer owned' },
      });

      await expect(run()).resolves.toBe('processed');
      expect(recordJobFailure).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Job no longer owned');
      // The completion boundary rolls back and nothing follows it: someone else
      // owns this job's outcome now.
      expect(boundaries).toEqual([true, true, false]);
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

    it('should still open a fresh boundary to record the failure after the throw', async () => {
      // The throw happens outside any boundary (the pipeline is unwrapped), so the
      // failure record is a clean new transaction rather than a doomed one.
      const { run, boundaries } = build({
        pipeline: () => Promise.reject(new Error('socket hang up')),
      });

      await run();

      expect(boundaries).toEqual([true, true, true]);
    });
  });
});
