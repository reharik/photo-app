import { MediaKind, WorkVerdict } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { MediaProcessingJobRepository, SystemMediaItemRepository } from '@packages/media-core';
import { MediaJobWorkflow } from './processNextMediaImageJob';

export interface ClaimJobRow {
  (): Promise<MediaJobWorkflow>;
}

type ClaimJobRowDeps = {
  systemMediaItemRepository: SystemMediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  logger: Logger;
};

export const build__ClaimJobRow =
  ({
    mediaProcessingJobRepository,
    systemMediaItemRepository,
    logger,
  }: ClaimJobRowDeps): ClaimJobRow =>
  async (): Promise<MediaJobWorkflow> => {
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

    const mediaItem = await systemMediaItemRepository.getMediaItemById(job.mediaItemId);

    if (!mediaItem) {
      await mediaProcessingJobRepository.markFailed(job.id, actorId, 'media item not found');
      return {
        status: 'stop',
        level: 'error',
        outcome: 'processed',
        message: `Media item not found — job terminal. jobId: ${job.id}, mediaItemId: ${job.mediaItemId}`,
      };
    }
    if (!mediaItem.kind.equals(MediaKind.photo)) {
      await mediaProcessingJobRepository.markFailed(job.id, actorId, 'not a photo');
      return {
        status: 'stop',
        level: 'error',
        outcome: 'processed',
        message: `Non-photo enqueued for image processing. jobId: ${job.id}`,
      };
    }

    if (mediaItem.status.work.equals(WorkVerdict.terminal)) {
      await mediaProcessingJobRepository.markFailed(job.id, actorId, '');
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
      return {
        status: 'stop',
        level: 'warn',
        outcome: 'processed',
        message: `Item not yet processable — requeued with backoff. jobId: ${job.id}, status: ${mediaItem.status.value}`,
      };
    }
    if (mediaItem.status.work.equals(WorkVerdict.succeeded)) {
      await mediaProcessingJobRepository.markSucceeded(job.id, actorId);
      return {
        status: 'stop',
        level: 'info',
        outcome: 'processed',
        message: `Item already ready — closing orphaned job. jobId: ${job.id}`,
      };
    }
    return { status: 'continue', job };
  };
