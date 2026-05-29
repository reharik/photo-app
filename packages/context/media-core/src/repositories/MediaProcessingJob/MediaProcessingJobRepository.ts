import type { EntityId } from '../../types/types';
import type { MediaProcessingJobStatus } from './mediaProcessingJobStatus';

export type MediaProcessingJobRow = {
  id: EntityId;
  mediaItemId: EntityId;
  status: MediaProcessingJobStatus;
  attemptCount: number;
  availableAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: EntityId;
  updatedBy: EntityId;
  startedAt?: Date;
  completedAt?: Date;
  lastError?: string;
};

export type MediaProcessingJobRepository = {
  enqueueIfNoneActive: (input: { mediaItemId: EntityId; actorId: EntityId }) => Promise<void>;
  claimNextAvailableJob: () => Promise<MediaProcessingJobRow | undefined>;
  markSucceeded: (jobId: EntityId, actorId: EntityId) => Promise<void>;
  markFailed: (jobId: EntityId, actorId: EntityId, lastError: string) => Promise<void>;
};
