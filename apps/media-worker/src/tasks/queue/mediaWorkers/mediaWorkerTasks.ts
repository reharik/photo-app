import { QueueWorkerTask } from '../../../types';
import { RunNextMediaDeletionJob } from './processNextMediaDeletionJob';
import { RunNextMediaImageJob } from './processNextMediaImageJob';

// Priority-ordered tasks: deletion before image. Queue tasks are always due —
// the claim inside each runner is itself the work-probe (returns 'idle' when
// the queue is empty).
//
// Each task gets its own named contract interface extending the union arm it
// returns, with `name` narrowed to the task's literal: IoC discovery cannot use
// the WorkerTask UNION as a contract (factories annotated with it are dropped
// with contract_not_resolved), and a bare alias of the arm is structurally
// deduped (two aliases of QueueWorkerTask = one contract with two
// implementations). A distinct interface makes each task its own contract with
// a single implementation — no arbitrary `default` registration needed.

export interface MediaDeletionTask extends QueueWorkerTask {
  name: 'media-deletion';
}

type MediaDeletionTaskDeps = {
  runNextMediaDeletionJob: RunNextMediaDeletionJob;
};

export const build__MediaDeletionTask = ({
  runNextMediaDeletionJob,
}: MediaDeletionTaskDeps): MediaDeletionTask => ({
  name: 'media-deletion',
  type: 'queue',
  run: runNextMediaDeletionJob,
  order: 100,
});

export interface MediaImageTask extends QueueWorkerTask {
  name: 'media-image';
}

type MediaImageTaskDeps = {
  runNextMediaImageJob: RunNextMediaImageJob;
};

export const build__MediaImageTask = ({
  runNextMediaImageJob,
}: MediaImageTaskDeps): MediaImageTask => ({
  name: 'media-image',
  type: 'queue',
  run: runNextMediaImageJob,
  order: 200,
});
