import type { EntityId } from '../../types/types';
import type { MediaDeletionJobStatus } from './mediaDeletionJobStatus';

export type MediaDeletionJobRow = {
  id: EntityId;
  mediaItemId: EntityId;
  /** Base storage prefix (same as `media_item.storage_key`); used to delete objects if the row is already gone. */
  storageKey: string;
  status: MediaDeletionJobStatus;
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

export type MediaDeletionJobRepository = {
  enqueueIfNoneActive: (input: {
    mediaItemId: EntityId;
    storageKey: string;
    actorId: EntityId;
  }) => Promise<void>;
  claimNextAvailableJob: () => Promise<MediaDeletionJobRow | undefined>;
  markSucceeded: (jobId: EntityId, actorId: EntityId) => Promise<void>;
  markFailed: (jobId: EntityId, actorId: EntityId, lastError: string) => Promise<void>;
  markPendingRetry: (
    jobId: EntityId,
    actorId: EntityId,
    lastError: string,
    availableAt: Date,
  ) => Promise<void>;
};
