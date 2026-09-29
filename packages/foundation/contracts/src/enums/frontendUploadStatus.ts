import { enumeration, type Enumeration } from '@reharik/smart-enum';
const input = {
  queued: { display: 'Waiting' },
  creating: { display: 'Preparing' },
  /** Holds a presigned URL; waiting for its turn to PUT. */
  presigned: { display: 'Waiting' },
  uploading: { display: 'Uploading' },
  finalizing: { display: 'Finishing' },
  complete: { display: 'Processing' },
  ready: { display: 'Done' },
  /**
   * The widget stopped waiting before the server finished (budget ran out, status requests kept
   * failing, or the item is gone). Not a failure: the item may still go ready server-side.
   */
  processingDelayed: { display: 'Still processing' },
  failed: { display: 'Failed' },
} as const;

export type FrontendUploadStatus = Enumeration<typeof FrontendUploadStatus>;
export const FrontendUploadStatus = enumeration<typeof input>('FrontendUploadStatus', {
  input: input,
});

export const isInFlightStatus = (status: FrontendUploadStatus): boolean =>
  status.equals(FrontendUploadStatus.queued) ||
  status.equals(FrontendUploadStatus.creating) ||
  status.equals(FrontendUploadStatus.presigned) ||
  status.equals(FrontendUploadStatus.uploading) ||
  status.equals(FrontendUploadStatus.finalizing);

export const isTerminalStatus = (status: FrontendUploadStatus): boolean =>
  status.equals(FrontendUploadStatus.ready) ||
  status.equals(FrontendUploadStatus.processingDelayed) ||
  status.equals(FrontendUploadStatus.failed);
