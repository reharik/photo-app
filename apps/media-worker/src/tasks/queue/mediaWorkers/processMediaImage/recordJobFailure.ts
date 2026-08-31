import {
  EntityId,
  MediaItemRepository,
  MediaProcessingJobRepository,
  MediaProcessingJobRow,
  UnitOfWork,
} from '@packages/media-core';

export interface RecordJobFailure {
  (
    job: MediaProcessingJobRow,
    actorId: EntityId,
    message: string,
    retryable: boolean,
  ): Promise<void>;
}

type RecordJobFailureDeps = {
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  mediaItemRepository: MediaItemRepository;
  uow: UnitOfWork;
};

export const build__RecordJobFailure =
  ({
    mediaProcessingJobRepository,
    mediaItemRepository,
    uow,
  }: RecordJobFailureDeps): RecordJobFailure =>
  async (job, actorId, message, retryable): Promise<void> => {
    await uow.join();

    try {
      // Retryable: the queue decides whether attempts remain. Non-retryable
      // goes terminal immediately, no cap consulted.
      const failItem = retryable
        ? (await mediaProcessingJobRepository.markPendingRetry(job.id, actorId, message)) ===
          'exhausted'
        : await mediaProcessingJobRepository.markFailed(job.id, actorId, message);

      // Only fail the item if we actually owned the job — a false from either
      // write means the sweep reclaimed it and someone else is responsible.
      if (failItem) {
        const item = await mediaItemRepository.getById(job.mediaItemId);
        if (item) {
          item.markProcessingFailed(actorId);
          await mediaItemRepository.save(item);
        }
      }
      await uow.complete(true);
    } catch (e) {
      await uow.settle(false);
      throw e;
    }
  };
