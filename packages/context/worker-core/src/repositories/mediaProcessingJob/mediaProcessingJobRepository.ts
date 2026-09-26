import { MediaJobStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';

import type { EntityId } from '@packages/contracts';
import { UnitOfWork } from '../../infrastructure';

/**
 * The worker's half of the media-processing queue: claim a job, and settle it
 * (succeeded / failed / requeued), plus the stalled-job sweep. Enqueueing is the
 * API's half and lives in `@packages/media-core`.
 *
 * The claim/retry mechanics used to live in a generic `createJobQueueRepository`
 * that this file composed, parameterised by table name, attempt-count column and a
 * map of row-specific enum columns. `media_processing_job` was its only caller — the
 * deletion queue it was written to share with was removed — so the indirection was
 * paying for a second consumer that does not exist, and the seams cost more than
 * they bought: the table name and attempt-count column travelled as strings, one of
 * which was silently the wrong case (see `markPendingRetry`), and the attempt cap
 * existed twice. It is one ordinary repository now. If a second queue ever appears,
 * extract the shape it actually needs then, from two real callers.
 */

/**
 * Attempt budget for one media processing job, shared by the two places that
 * enforce it: `markPendingRetry` below (give up once attempts are exhausted) and
 * the stalled-job sweep (a stall never throws, so without this cap the sweep would
 * resurrect a worker-killing job forever).
 *
 * Previously there were two of these — this one and a `MAX_ATTEMPTS` private to the
 * generic queue helper — both 3, with nothing tying them together. One constant now.
 */
export const MAX_MEDIA_PROCESSING_JOB_ATTEMPTS = 3;

/** Exponential backoff between attempts: 30s, 60s, 120s … capped at an hour. */
const RETRY_BASE_SECONDS = 30;
const RETRY_CAP_SECONDS = 3600;

/** `last_error` is bounded; a stack trace can easily exceed the column. */
const truncateError = (message: string, maxLen: number): string => {
  if (message.length <= maxLen) {
    return message;
  }
  return `${message.slice(0, maxLen - 3)}...`;
};

const LAST_ERROR_MAX_LEN = 8000;

/** The queue table. Literal rather than a parameter — there is one queue. */
const TABLE = 'mediaProcessingJob';

export type RetryOutcome = 'retrying' | 'exhausted' | 'notOwned';

export type MediaProcessingJobRow = {
  id: EntityId;
  mediaItemId: EntityId;
  mediaKind: MediaKind;
  status: MediaJobStatus;
  attemptCount: number;
  availableAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: EntityId;
  updatedBy: EntityId;
  startedAt?: Date;
  completedAt?: Date;
  lastError?: string;
};

export interface MediaProcessingJobRepository {
  claimNextAvailableJob: () => Promise<MediaProcessingJobRow | undefined>;
  markSucceeded: (jobId: EntityId, actorId: EntityId) => Promise<boolean>;
  markFailed: (jobId: EntityId, actorId: EntityId, lastError: string) => Promise<boolean>;
  markPendingRetry: (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
  ) => Promise<RetryOutcome>;
  releaseStalledJobs: (stalledBefore: Date) => Promise<ReleaseStalledJobsResult>;
}

export type ReleaseStalledJobsResult = {
  /** Stalled jobs under the attempt cap, put back to PENDING for another claim. */
  released: number;
  /** Stalled jobs at/over the cap, marked FAILED (their items moved off PROCESSING too). */
  failed: number;
};

type MediaProcessingJobRepositoryDeps = {
  uow: UnitOfWork;
};

export const build__MediaProcessingJobRepository = ({
  uow,
}: MediaProcessingJobRepositoryDeps): MediaProcessingJobRepository => {
  /**
   * Claim one job: `SELECT … FOR UPDATE SKIP LOCKED` to lock a PENDING row, then a
   * conditional flip to PROCESSING that increments the attempt count.
   *
   * Two statements, deliberately, both on the caller's transaction: the lock taken
   * by the select must still be held when the update lands. The caller wraps this in
   * its own `uow.inTransaction(...)` so the PROCESSING flip commits independently and
   * is visible to other workers before any downstream work runs — never a savepoint.
   */
  const claimNextAvailableJob = async (): Promise<MediaProcessingJobRow | undefined> => {
    const selected = await uow
      .db()(TABLE)
      .where({ status: MediaJobStatus.pending.value })
      .andWhere('availableAt', '<=', uow.db().fn.now())
      .orderBy('availableAt', 'asc')
      .orderBy('id', 'asc')
      .forUpdate()
      .skipLocked()
      .limit(1)
      .select<{ id: EntityId }[]>('id');

    const next = selected[0];
    if (!next) {
      return undefined;
    }

    const updated = await withEnumRevival(
      uow
        .db()(TABLE)
        .where({ id: next.id, status: MediaJobStatus.pending.value })
        .update({
          status: MediaJobStatus.processing.value,
          startedAt: uow.db().fn.now(),
          // Raw SQL bypasses the identifier case-mapping layer, so this is the
          // PHYSICAL column name. Everywhere else in this file uses camelCase and
          // lets knex-stringcase map it.
          attemptCount: uow.db().raw('?? + 1', ['attempt_count']),
          updatedAt: uow.db().fn.now(),
        })
        .returning('*'),
      // `returning('*')` hands back raw wire strings, while MediaProcessingJobRow
      // types both of these as smart-enum members — and the worker calls
      // `job.mediaKind.equals(...)` to pick a pipeline. Without revival that call
      // would be made on a string.
      { status: MediaJobStatus, mediaKind: MediaKind },
    );

    return updated[0] as MediaProcessingJobRow;
  };

  /**
   * Ownership is a WHERE clause: every mark below carries `status = 'PROCESSING'`
   * and reports whether it actually matched. A miss means the stalled sweep
   * reclaimed the job, so someone else owns its outcome and the item must be left
   * alone.
   */
  const markSucceeded = async (jobId: EntityId, actorId: EntityId): Promise<boolean> => {
    const count = await uow
      .db()(TABLE)
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .update({
        status: MediaJobStatus.succeeded.value,
        completedAt: uow.db().fn.now(),
        lastError: null,
        updatedAt: uow.db().fn.now(),
        updatedBy: actorId,
      });
    return count === 1;
  };

  const markFailed = async (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
  ): Promise<boolean> => {
    const count = await uow
      .db()(TABLE)
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .update({
        status: MediaJobStatus.failed.value,
        completedAt: uow.db().fn.now(),
        lastError: truncateError(lastError, LAST_ERROR_MAX_LEN),
        updatedAt: uow.db().fn.now(),
        updatedBy: actorId,
      });
    return count === 1;
  };

  /**
   * Retry policy lives here, not at call sites: the attempt cap and the backoff are
   * properties of the queue. Exceeding the cap terminal-fails instead of requeueing
   * forever. `attemptCount` was already incremented at claim time.
   */
  const markPendingRetry = async (
    jobId: EntityId,
    actorId: EntityId,
    reason: string,
  ): Promise<RetryOutcome> => {
    // `first` rather than `exists`: the value itself decides cap-vs-backoff.
    //
    // Selected as camelCase and read back as camelCase. This used to select the
    // physical 'attempt_count' and index the row with the same string, typed as
    // `Record<string, number>` so nothing caught it — but knex-stringcase
    // camelCases response keys, so the lookup was always `undefined`: the cap
    // never tripped (`undefined >= 3` is false) and the backoff computed NaN,
    // which Postgres then rejected as an interval. Pinned by the two
    // markPendingRetry cases in the worker's repository suite.
    const row = await uow
      .db()(TABLE)
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .first<{ attemptCount: number } | undefined>('attemptCount');

    if (!row) {
      return 'notOwned';
    }

    if (row.attemptCount >= MAX_MEDIA_PROCESSING_JOB_ATTEMPTS) {
      await markFailed(
        jobId,
        actorId,
        `attempts exhausted (${MAX_MEDIA_PROCESSING_JOB_ATTEMPTS}): ${reason}`,
      );
      return 'exhausted';
    }

    const backoff = Math.min(
      RETRY_BASE_SECONDS * 2 ** Math.max(0, row.attemptCount - 1),
      RETRY_CAP_SECONDS,
    );

    const count = await uow
      .db()(TABLE)
      .where({ id: jobId, status: MediaJobStatus.processing.value })
      .update({
        status: MediaJobStatus.pending.value,
        availableAt: uow.db().raw("now() + (? || ' seconds')::interval", [backoff]),
        lastError: reason,
        updatedAt: uow.db().fn.now(),
        updatedBy: actorId,
      });
    return count === 1 ? 'retrying' : 'notOwned';
  };

  /**
   * Reclaim jobs stranded in PROCESSING by a worker that died mid-job. Same stall
   * predicate, two outcomes split on the attempt cap:
   * - under the cap: back to PENDING, claimable now — "a worker died".
   * - at/over the cap: FAILED — "an item is killing workers". The claim itself
   *   increments attemptCount, and a stall never reaches the worker's catch-path
   *   cap check, so without this arm the sweep would resurrect a poison job forever.
   *
   * The fail arm mirrors the worker's terminal-failure path
   * (markProcessingFailed: PROCESSING → FAILED, no-op otherwise): a FAILED job
   * whose item stays PROCESSING would just trade a stranded job for a stranded
   * item — the same silent hang in a different table. Both updates stamp
   * updatedBy from the row's own createdBy (the actor that enqueued the work).
   */
  const releaseStalledJobs = async (stalledBefore: Date): Promise<ReleaseStalledJobsResult> => {
    const released = await uow
      .db()(TABLE)
      .where({ status: MediaJobStatus.processing.value })
      .where('startedAt', '<', stalledBefore)
      .where('attemptCount', '<', MAX_MEDIA_PROCESSING_JOB_ATTEMPTS)
      .update({
        status: MediaJobStatus.pending.value,
        lastError: 'Reclaimed: stalled in PROCESSING',
        availableAt: uow.db().fn.now(),
        startedAt: null,
        updatedAt: uow.db().fn.now(),
        updatedBy: uow.db().ref('createdBy'),
      });

    const failedRows = await uow
      .db()(TABLE)
      .where({ status: MediaJobStatus.processing.value })
      .where('startedAt', '<', stalledBefore)
      .where('attemptCount', '>=', MAX_MEDIA_PROCESSING_JOB_ATTEMPTS)
      .update({
        status: MediaJobStatus.failed.value,
        lastError: 'Reclaimed: exceeded max attempts while stalled',
        completedAt: uow.db().fn.now(),
        updatedAt: uow.db().fn.now(),
        updatedBy: uow.db().ref('createdBy'),
      })
      .returning<{ mediaItemId: EntityId }[]>('mediaItemId');

    if (failedRows.length > 0) {
      await uow
        .db()('mediaItem')
        .whereIn(
          'id',
          failedRows.map((row) => row.mediaItemId),
        )
        .where({ status: MediaJobStatus.processing.value })
        .update({
          status: MediaJobStatus.failed.value,
          updatedAt: uow.db().fn.now(),
          updatedBy: uow.db().ref('createdBy'),
        });
    }

    return { released, failed: failedRows.length };
  };

  return {
    claimNextAvailableJob,
    markSucceeded,
    markFailed,
    markPendingRetry,
    releaseStalledJobs,
  };
};
