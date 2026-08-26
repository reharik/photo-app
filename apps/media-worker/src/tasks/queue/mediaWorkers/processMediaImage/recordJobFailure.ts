import { EntityId, MediaProcessingJobRow } from '@packages/media-core';
import { InJobScope } from './inJobScope';

export interface RecordJobFailure {
  (
    job: MediaProcessingJobRow,
    actorId: EntityId,
    message: string,
    retryable: boolean,
  ): Promise<void>;
}

type RecordJobFailureDeps = { inJobScope: InJobScope };

export const build__RecordJobFailure =
  ({ inJobScope }: RecordJobFailureDeps): RecordJobFailure =>
  async (job, actorId, message, retryable): Promise<void> =>
    inJobScope(async (ctx): Promise<{ commit: boolean; value: undefined }> => {
      // Retryable: the queue decides whether attempts remain. Non-retryable
      // goes terminal immediately, no cap consulted.
      const failItem = retryable
        ? (await ctx.mediaProcessingJobRepository.markPendingRetry(
            job.id,
            actorId,
            message,
            ctx.uow,
          )) === 'exhausted'
        : await ctx.mediaProcessingJobRepository.markFailed(job.id, actorId, message, ctx.uow);

      // Only fail the item if we actually owned the job — a false from either
      // write means the sweep reclaimed it and someone else is responsible.
      if (failItem) {
        const item = await ctx.mediaItemRepository.getById(job.mediaItemId);
        if (item) {
          item.markProcessingFailed(actorId);
          await ctx.mediaItemRepository.save(item);
        }
      }

      return { commit: true, value: undefined };
    });
