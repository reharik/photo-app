export const MediaProcessingJobStatus = {
  pending: 'pending',
  processing: 'processing',
  succeeded: 'succeeded',
  failed: 'failed',
} as const;

export type MediaProcessingJobStatus =
  (typeof MediaProcessingJobStatus)[keyof typeof MediaProcessingJobStatus];
