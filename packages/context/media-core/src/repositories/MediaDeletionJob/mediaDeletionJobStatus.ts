export const MediaDeletionJobStatus = {
  pending: 'pending',
  processing: 'processing',
  succeeded: 'succeeded',
  failed: 'failed',
} as const;

export type MediaDeletionJobStatus =
  (typeof MediaDeletionJobStatus)[keyof typeof MediaDeletionJobStatus];
