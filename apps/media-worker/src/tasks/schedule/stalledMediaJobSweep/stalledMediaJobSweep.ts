import { Logger } from '@packages/infrastructure';
import { MediaProcessingJobRepository, UnitOfWork } from '@packages/media-core';

export type StalledMediaJobSweep = () => Promise<'idle' | 'processed'>;

type StalledMediaJobSweepDeps = {
  logger: Logger;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  uow: UnitOfWork;
};

export const build__StalledMediaJobSweep = ({
  logger,
  mediaProcessingJobRepository,
  uow,
}: StalledMediaJobSweepDeps): StalledMediaJobSweep => {
  const STALLED_AFTER_MS = 10 * 60_000;
  return async () => {
    const stalledBefore = new Date(Date.now() - STALLED_AFTER_MS);

    try {
      await uow.begin();
      const { released, failed } =
        await mediaProcessingJobRepository.releaseStalledJobs(stalledBefore);
      await uow.complete(true);
      // Two separate signals: released means "a worker died mid-job" (recoverable,
      // the queue picks the job back up); failed means "an item keeps killing
      // workers" (a poison job hit the attempt cap and was given up on).
      if (released > 0) {
        logger.warn(
          `[stalled-media-job-sweep] released ${released} stalled job(s) back to PENDING`,
        );
      }
      if (failed > 0) {
        logger.error(
          `[stalled-media-job-sweep] marked ${failed} stalled job(s) FAILED: exceeded max attempts — an item may be killing workers`,
        );
      }
      return released + failed > 0 ? 'processed' : 'idle';
    } catch (e) {
      await uow.complete(false);
      logger.error('Release of stalled Jobs failed', e);
      throw e;
    }
  };
};
