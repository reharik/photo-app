import { MediaKind, WorkVerdict } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import {
  MediaProcessingJobRepository,
  SystemMediaItemRepository,
  UnitOfWork,
} from '@packages/media-core';
import { MediaJobWorkflow } from './processNextMediaImageJob';

export interface ClaimJobRow {
  (): Promise<MediaJobWorkflow>;
}

type ClaimJobRowDeps = {
  systemMediaItemRepository: SystemMediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  logger: Logger;
  uow: UnitOfWork;
};

export const build__ClaimJobRow =
  ({
    mediaProcessingJobRepository,
    systemMediaItemRepository,
    logger,
    uow,
  }: ClaimJobRowDeps): ClaimJobRow =>
  async (): Promise<MediaJobWorkflow> => {
    // claimNextAvailableJob manages it's own UOW lifecycle
    const job = await mediaProcessingJobRepository.claimNextAvailableJob();
    if (!job) {
      return { status: 'stop', level: 'debug', outcome: 'idle', message: 'No jobs ready' };
    }

    const actorId = job.createdBy;

    logger.info('Media image processing job claimed', {
      jobId: job.id,
      mediaItemId: job.mediaItemId,
      attemptCount: job.attemptCount,
    });

    await uow.join();
    const mediaItem = await systemMediaItemRepository.getMediaItemById(job.mediaItemId);

    if (!mediaItem) {
      await mediaProcessingJobRepository.markFailed(job.id, actorId, 'media item not found');
      await uow.complete(true);
      return {
        status: 'stop',
        level: 'error',
        outcome: 'processed',
        message: `Media item not found — job terminal. jobId: ${job.id}, mediaItemId: ${job.mediaItemId}`,
      };
    }
    if (!mediaItem.kind.equals(MediaKind.photo)) {
      await mediaProcessingJobRepository.markFailed(job.id, actorId, 'not a photo');
      await uow.complete(true);
      return {
        status: 'stop',
        level: 'error',
        outcome: 'processed',
        message: `Non-photo enqueued for image processing. jobId: ${job.id}`,
      };
    }

    if (mediaItem.status.work.equals(WorkVerdict.terminal)) {
      await mediaProcessingJobRepository.markFailed(
        job.id,
        actorId,
        `item abandoned (${mediaItem.status.value})`,
      );
      await uow.complete(true);
      return {
        status: 'stop',
        level: 'error',
        message: 'MediaItem in either failed or deleted state',
        outcome: 'processed',
      };
    }
    if (mediaItem.status.work.equals(WorkVerdict.retryable)) {
      await mediaProcessingJobRepository.markPendingRetry(
        job.id,
        actorId,
        `item not yet processable (${mediaItem.status.value})`,
      );
      await uow.complete(true);
      return {
        status: 'stop',
        level: 'warn',
        outcome: 'processed',
        message: `Item not yet processable — requeued with backoff. jobId: ${job.id}, status: ${mediaItem.status.value}`,
      };
    }
    if (mediaItem.status.work.equals(WorkVerdict.succeeded)) {
      await mediaProcessingJobRepository.markSucceeded(job.id, actorId);
      await uow.complete(true);
      return {
        status: 'stop',
        level: 'info',
        outcome: 'processed',
        message: `Item already ready — closing orphaned job. jobId: ${job.id}`,
      };
    }
    await uow.complete(true);
    return { status: 'continue', job };
  };
