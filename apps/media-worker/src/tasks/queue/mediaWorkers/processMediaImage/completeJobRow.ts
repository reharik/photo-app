import { EntityId, MediaProcessingJobRow } from '@packages/media-core';
import { InJobScope } from './inJobScope';
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
  inJobScope: InJobScope;
};

export const build__CompleteJobRow =
  ({ inJobScope }: CompleteJobRowDeps): CompleteJobRow =>
  async (job, pipelineResult, actorId): Promise<CompletionResult> =>
    inJobScope(async (ctx): Promise<{ commit: boolean; value: CompletionResult }> => {
      // Job row first: WHERE status = PROCESSING is the ownership check. If the
      // stalled sweep reclaimed this job, we lose the race here and touch nothing.
      const claimed = await ctx.mediaProcessingJobRepository.markSucceeded(job.id, actorId);

      if (!claimed) {
        return {
          commit: false,
          value: {
            outcome: 'notOwned',
            message: `Job no longer owned — reclaimed or cancelled. jobId: ${job.id}`,
          },
        };
      }

      // Re-read inside the trx: the item read at claim time is stale by the
      // length of the pipeline.
      const item = await ctx.mediaItemRepository.getById(job.mediaItemId);
      if (!item) {
        return {
          commit: false,
          value: {
            outcome: 'itemGone',
            message: `Item deleted mid-pipeline — rolling back. jobId: ${job.id}`,
          },
        };
      }

      const applied = item.applyProcessingResults(pipelineResult, actorId);
      if (!applied.success) {
        return {
          commit: false,
          value: {
            outcome: 'applyFailed',
            message: `Could not apply results — rolled back, requeuing. jobId: ${job.id}, error: ${JSON.stringify(applied.error)}`,
          },
        };
      }

      await ctx.mediaItemRepository.save(item);
      return { commit: true, value: { outcome: 'completed' } };
    });
