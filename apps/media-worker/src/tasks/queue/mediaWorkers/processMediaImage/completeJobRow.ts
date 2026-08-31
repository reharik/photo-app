import {
  EntityId,
  MediaItemRepository,
  MediaProcessingJobRepository,
  MediaProcessingJobRow,
  UnitOfWork,
} from '@packages/media-core';
import { PipelineResult } from './processNextMediaImageJob';

export type CompletionResult =
  | { outcome: 'completed' }
  | { outcome: 'notOwned'; message: string }
  | { outcome: 'itemGone'; message: string }
  | { outcome: 'applyFailed'; message: string };

export interface CompleteJobRow {
  (
    job: MediaProcessingJobRow,
    pipelineResult: PipelineResult,
    actorId: EntityId,
  ): Promise<CompletionResult>;
}

type CompleteJobRowDeps = {
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  mediaItemRepository: MediaItemRepository;
  uow: UnitOfWork;
};

export const build__CompleteJobRow =
  ({
    mediaProcessingJobRepository,
    mediaItemRepository,
    uow,
  }: CompleteJobRowDeps): CompleteJobRow =>
  async (job, pipelineResult, actorId): Promise<CompletionResult> => {
    try {
      // Job row first: WHERE status = PROCESSING is the ownership check. If the
      // stalled sweep reclaimed this job, we lose the race here and touch nothing.
      await uow.join();
      const claimed = await mediaProcessingJobRepository.markSucceeded(job.id, actorId);

      if (!claimed) {
        await uow.complete(false);
        return {
          outcome: 'notOwned',
          message: `Job no longer owned — reclaimed or cancelled. jobId: ${job.id}`,
        };
      }

      // Re-read inside the trx: the item read at claim time is stale by the
      // length of the pipeline.
      const item = await mediaItemRepository.getById(job.mediaItemId);
      if (!item) {
        await uow.complete(false);
        return {
          outcome: 'itemGone',
          message: `Item deleted mid-pipeline — rolling back. jobId: ${job.id}`,
        };
      }

      const applied = item.applyProcessingResults(pipelineResult, actorId);
      if (!applied.success) {
        await uow.complete(false);
        return {
          outcome: 'applyFailed',
          message: `Could not apply results — rolled back, requeuing. jobId: ${job.id}, error: ${JSON.stringify(applied.error)}`,
        };
      }

      await mediaItemRepository.save(item);
      await uow.complete(true);

      return { outcome: 'completed' };
    } catch (e) {
      await uow.settle(false);
      throw e;
    }
  };
