import { Logger } from '@packages/infrastructure';
import { MediaProcessingJobRepository, UnitOfWork } from '@packages/worker-core';
import { WorkerTaskOutcome } from '../../../../types';
import { CompleteJobRow } from './completeJobRow';
import { RecordJobFailure } from './recordJobFailure';
import { RunImageStoragePipeline } from './runImageStoragePipeline';
import { TriageJob } from './triageJob';

const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

// Programmer errors won't fix themselves on retry.
const isRetryable = (e: unknown): boolean =>
  !(e instanceof TypeError || e instanceof RangeError || e instanceof SyntaxError);

export interface ProcessNextMediaImageJob {
  (): Promise<WorkerTaskOutcome>;
}

type ProcessNextMediaImageJobDeps = {
  logger: Logger;
  runImageStoragePipeline: RunImageStoragePipeline;
  completeJobRow: CompleteJobRow;
  recordJobFailure: RecordJobFailure;
  uow: UnitOfWork;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  triageJob: TriageJob;
};

export const build__ProcessNextMediaImageJob =
  ({
    logger,
    runImageStoragePipeline,
    completeJobRow,
    recordJobFailure,
    uow,
    mediaProcessingJobRepository,
    triageJob,
  }: ProcessNextMediaImageJobDeps): ProcessNextMediaImageJob =>
  async (): Promise<WorkerTaskOutcome> => {
    const job = await uow.inTransaction(mediaProcessingJobRepository.claimNextAvailableJob);
    if (!job) {
      logger.debug('No jobs ready');
      return 'idle';
    }

    const workflow = await uow.inTransaction(() => triageJob(job));
    if (workflow.status === 'stop') {
      logger[workflow.level](workflow.message);
      return workflow.outcome;
    }

    const actorId = job.createdBy;
    try {
      const pipelineResult = await runImageStoragePipeline(job, actorId);
      if (pipelineResult.status === 'stop') {
        await uow.inTransaction(() =>
          recordJobFailure(job, actorId, pipelineResult.message, false),
        );
        logger.error(`Pipeline failed — job terminal. jobId: ${job.id}: ${pipelineResult.message}`);
        return 'processed';
      }

      const completion = await uow.inTransaction(async () => {
        const r = await completeJobRow(job, pipelineResult.pipelineResult, actorId);
        if (r.outcome !== 'completed') {
          uow.flagRollbackOnly();
        }
        return r;
      });

      if (completion.outcome === 'completed') {
        return 'processed';
      }
      if (completion.outcome === 'applyFailed') {
        logger.error(completion.message);
        await uow.inTransaction(() => recordJobFailure(job, actorId, completion.message, true));
      } else {
        logger.warn(completion.message);
      }
    } catch (e) {
      logger.error('Media image job threw', { jobId: job.id, error: e });
      await uow.inTransaction(() =>
        recordJobFailure(job, actorId, errorMessage(e), isRetryable(e)),
      );
    }
    return 'processed';
  };
