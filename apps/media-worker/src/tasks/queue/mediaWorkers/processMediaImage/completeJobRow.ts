import { EntityId } from '@packages/contracts';
import {
  MediaItemRepository,
  MediaProcessingJobRepository,
  MediaProcessingJobRow,
} from '@packages/worker-core';
import { PipelineResult } from './types';

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
};

export const build__CompleteJobRow =
  ({ mediaProcessingJobRepository, mediaItemRepository }: CompleteJobRowDeps): CompleteJobRow =>
  async (job, pipelineResult, actorId): Promise<CompletionResult> => {
    // Job row first: WHERE status = PROCESSING is the ownership check. If the
    // stalled sweep reclaimed this job, we lose the race here and touch nothing.

    const claimed = await mediaProcessingJobRepository.markSucceeded(job.id, actorId);

    if (!claimed) {
      return {
        outcome: 'notOwned',
        message: `Job no longer owned — reclaimed or cancelled. jobId: ${job.id}`,
      };
    }

    // Re-read inside the trx: the item read at claim time is stale by the
    // length of the pipeline.
    const item = await mediaItemRepository.getById(job.mediaItemId);
    if (!item) {
      return {
        outcome: 'itemGone',
        message: `Item deleted mid-pipeline — rolling back. jobId: ${job.id}`,
      };
    }

    const applied = item.applyProcessingResults(pipelineResult, actorId);
    if (!applied.success) {
      return {
        outcome: 'applyFailed',
        message: `Could not apply results — rolled back, requeuing. jobId: ${job.id}, error: ${JSON.stringify(applied.error)}`,
      };
    }

    await mediaItemRepository.save(item);

    return { outcome: 'completed' };
  };
