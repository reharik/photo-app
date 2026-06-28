import { WorkerTask } from '../../types';
import { RunNextMediaDeletionJob } from './processNextMediaDeletionJob';
import { RunNextMediaImageJob } from './processNextMediaImageJob';

// Priority-ordered tasks: deletion before image. Queue tasks are always due —
// the claim inside each runner is itself the work-probe (returns 'idle' when
// the queue is empty). A future scheduled task gates due() on an interval.

type MediaDeletionTaskDeps = {
  runNextMediaDeletionJob: RunNextMediaDeletionJob;
};

export const build__MediaDeletionTask = ({
  runNextMediaDeletionJob,
}: MediaDeletionTaskDeps): WorkerTask => ({
  name: 'media-deletion',
  due: () => true,
  run: runNextMediaDeletionJob,
  order: 100,
});

type MediaImageTaskDeps = {
  runNextMediaImageJob: RunNextMediaImageJob;
};

export const build__MediaImageTask = ({
  runNextMediaImageJob,
}: MediaImageTaskDeps): WorkerTask => ({
  name: 'media-image',
  due: () => true,
  run: runNextMediaImageJob,
  order: 200,
});
