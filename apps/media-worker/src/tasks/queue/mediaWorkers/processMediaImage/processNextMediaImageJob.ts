import { MediaAssetKind } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { EntityId, MediaProcessingJobRow } from '@packages/media-core';
import { WorkerTaskOutcome } from '../../../../types';
import { ClaimJobRow } from './claimJobRow';
import { CompleteJobRow } from './completeJobRow';
import { RecordJobFailure } from './recordJobFailure';
import { RunImageStoragePipeline } from './runImageStoragePipeline';

export type PipelineAsset = {
  sizeBytes: number;
  mimeType: string;
  width: number;
  height: number;
  kind: MediaAssetKind;
};

export type Capture = {
  takenAtUtc?: Date;
  takenAtUtcOffsetMinutes?: number;
};

export type PipelineResult = {
  displayAsset: PipelineAsset;
  thumbnailAsset: PipelineAsset;
  originalAsset?: PipelineAsset;
  capture: Capture;
};
export type MediaJobWorkflow =
  | {
      status: 'stop';
      level: 'debug' | 'info' | 'warn' | 'error';
      message: string;
      outcome: WorkerTaskOutcome;
      applyFailed?: boolean;
    }
  | { status: 'continue'; job: MediaProcessingJobRow };

export type CompletionResult =
  | { outcome: 'completed' }
  | { outcome: 'notOwned'; message: string }
  | { outcome: 'itemGone'; message: string }
  | { outcome: 'applyFailed'; message: string };

export type PipelineJobWorkflow =
  { status: 'stop'; message: string } | { status: 'continue'; pipelineResult: PipelineResult };

export const stop = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  outcome: WorkerTaskOutcome = 'processed',
): MediaJobWorkflow => ({ status: 'stop', level, message, outcome });

export const applyFailed = (error: unknown, jobId: EntityId): MediaJobWorkflow => ({
  status: 'stop',
  level: 'error',
  outcome: 'processed',
  applyFailed: true,
  message: `Could not apply results — rolled back, requeuing. jobId: ${jobId}, error: ${JSON.stringify(error)}`,
});

const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

// Programmer errors won't fix themselves on retry.
const isRetryable = (e: unknown): boolean =>
  !(e instanceof TypeError || e instanceof RangeError || e instanceof SyntaxError);

export interface ProcessNextMediaImageJob {
  (): Promise<WorkerTaskOutcome>;
}

type ProcessNextMediaImageJobDeps = {
  logger: Logger;
  claimJobRow: ClaimJobRow;
  runImageStoragePipeline: RunImageStoragePipeline;
  completeJobRow: CompleteJobRow;
  recordJobFailure: RecordJobFailure;
};

export const build__ProcessNextMediaImageJob =
  ({
    logger,
    claimJobRow,
    runImageStoragePipeline,
    completeJobRow,
    recordJobFailure,
  }: ProcessNextMediaImageJobDeps): ProcessNextMediaImageJob =>
  async (): Promise<WorkerTaskOutcome> => {
    const claimResult = await claimJobRow();
    if (claimResult.status === 'stop') {
      if (claimResult.outcome !== 'idle') {
        logger[claimResult.level](claimResult.message);
      }
      return claimResult.outcome;
    }
    const { job } = claimResult;
    const actorId = job.createdBy;

    try {
      const pipelineResult = await runImageStoragePipeline(job, actorId);
      if (pipelineResult.status === 'stop') {
        await recordJobFailure(job, actorId, pipelineResult.message, false);
        logger.error(`Pipeline failed — job terminal. jobId: ${job.id}: ${pipelineResult.message}`);
        return 'processed';
      }

      const completion = await completeJobRow(job, pipelineResult.pipelineResult, actorId);

      if (completion.outcome === 'applyFailed') {
        logger.error(completion.message);
        await recordJobFailure(job, actorId, completion.message, true);
      } else if (completion.outcome !== 'completed') {
        logger.warn(completion.message);
      }
      return 'processed';
    } catch (e) {
      logger.error('Media image job threw', { jobId: job.id, error: e });
      await recordJobFailure(job, actorId, errorMessage(e), isRetryable(e));
      return 'processed';
    }
  };
